#!/usr/bin/env node
/**
 * Podcast post-production automation for Reversim Podcast
 *
 * Steps:
 *   1. (Optional) Mix raw WAV tracks from GarageBand project into a single MP3
 *   2. Add intro/outro with fade-in/out and normalize loudness via ffmpeg
 *   3. Transcribe via Gemini File API (handles 30–90 min files)
 *   4. Generate Hebrew blog post from transcript
 *   5. Upload processed MP3 to S3
 *
 * Usage — from GarageBand export:
 *   node scripts/post-production.mjs \
 *     --input ~/path/to/exported.mp3 \
 *     --episode 513 --title "Episode Title"
 *
 * Usage — mix raw WAV tracks directly (no GarageBand export needed):
 *   node scripts/post-production.mjs \
 *     --mix-wavs ~/Music/GarageBand/reversim513.band \
 *     --episode 513 --title "Episode Title"
 *
 * All options:
 *   --input, -i        Input MP3/WAV file (required unless --mix-wavs)
 *   --mix-wavs DIR     GarageBand .band dir; mixes all WAV files in Media/Audio Files/
 *   --episode, -e      Episode number (required)
 *   --title, -t        Episode title in Hebrew (required)
 *   --date, -d         Date YYYY-MM-DD (default: today)
 *   --slug, -s         URL slug (auto-derived from episode number if not provided)
 *   --intro            Intro MP3 (default: $REVERSIM_INTRO or assets/intro.mp3)
 *   --outro            Outro MP3 (default: $REVERSIM_OUTRO or assets/outro.mp3)
 *   --bucket, -b       S3 bucket (default: m2.reversim.com)
 *   --workdir          Working directory for intermediate files (default: cwd)
 *   --tags             Comma-separated tags
 *   --skip-mix         Skip WAV mixing step
 *   --skip-audio       Skip intro/outro/normalize step
 *   --skip-transcribe  Skip Gemini transcription step
 *   --skip-post        Skip blog post generation step
 *   --skip-upload      Skip S3 upload step
 *
 * Environment variables:
 *   GEMINI_API_KEY    Google Gemini API key (required for transcription/post steps)
 *   REVERSIM_INTRO    Default path to intro MP3
 *   REVERSIM_OUTRO    Default path to outro MP3
 *   AWS_PROFILE       AWS profile (optional)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');


// ─── Argument parsing ────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    mixWavs: null,
    episode: null,
    title: null,
    date: new Date().toISOString().split('T')[0],
    slug: null,
    intro: process.env.REVERSIM_INTRO || join(REPO_ROOT, 'assets/intro.mp3'),
    outro: process.env.REVERSIM_OUTRO || join(REPO_ROOT, 'assets/outro.mp3'),
    bucket: 'reversim',
    workdir: process.cwd(),
    tags: [],
    coverImage: null,
    transcriber: 'gemini',  // 'gemini' or 'ivrit' (ivrit requires RunPod)
    skipMix: false,
    skipAudio: false,
    skipTranscribe: false,
    skipPost: false,
    skipUpload: false,
    skipSocial: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':          case '-i': opts.input = resolve(args[++i]); break;
      case '--mix-wavs':                  opts.mixWavs = resolve(args[++i]); break;
      case '--episode':        case '-e': opts.episode = parseInt(args[++i], 10); break;
      case '--title':          case '-t': opts.title = args[++i]; break;
      case '--date':           case '-d': opts.date = args[++i]; break;
      case '--slug':           case '-s': opts.slug = args[++i]; break;
      case '--intro':                     opts.intro = resolve(args[++i]); break;
      case '--outro':                     opts.outro = resolve(args[++i]); break;
      case '--bucket':         case '-b': opts.bucket = args[++i]; break;
      case '--workdir':                   opts.workdir = resolve(args[++i]); break;
      case '--tags':                      opts.tags = args[++i].split(',').map(t => t.trim()); break;
      case '--cover-image':               opts.coverImage = args[++i]; break;
      case '--transcriber':               opts.transcriber = args[++i]; break;
      case '--skip-mix':                  opts.skipMix = true; break;
      case '--skip-audio':                opts.skipAudio = true; break;
      case '--skip-transcribe':           opts.skipTranscribe = true; break;
      case '--skip-post':                 opts.skipPost = true; break;
      case '--skip-upload':               opts.skipUpload = true; break;
      case '--skip-social':               opts.skipSocial = true; break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!opts.input && !opts.mixWavs) {
    console.error('Either --input or --mix-wavs is required');
    process.exit(1);
  }
  if (!opts.episode) { console.error('--episode is required'); process.exit(1); }
  if (!opts.title)   { console.error('--title is required');   process.exit(1); }

  if (opts.input && !existsSync(opts.input)) {
    console.error(`Input file not found: ${opts.input}`);
    process.exit(1);
  }

  if (!opts.slug) {
    // Use episode number as slug base — user can pass --slug for a descriptive one
    opts.slug = `episode-${opts.episode}`;
  }

  return opts;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function run(cmd, { silent = false } = {}) {
  if (!silent) console.log(`  $ ${cmd.slice(0, 140)}`);
  return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
}

function getAudioDuration(file) {
  return parseFloat(
    runCapture(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
    ).trim()
  );
}

async function promptCoverImage() {
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('\n  Cover image — enter a URL to download or a local /images/path (leave blank to skip): ', answer => {
      rl.close();
      resolve(answer.trim() || null);
    });
  });
}

// ─── Step 0: Mix WAV tracks ──────────────────────────────────────────────────

function mixWavTracks(bandDir, outputMp3) {
  console.log('\n▶ Step 0: Mixing WAV tracks from GarageBand project');

  const audioFilesDir = join(bandDir, 'Media', 'Audio Files');
  if (!existsSync(audioFilesDir)) {
    console.error(`  ✗ Audio Files directory not found: ${audioFilesDir}`);
    process.exit(1);
  }

  const wavFiles = readdirSync(audioFilesDir)
    .filter(f => extname(f).toLowerCase() === '.wav')
    .sort()
    .map(f => join(audioFilesDir, f));

  if (wavFiles.length === 0) {
    console.error(`  ✗ No WAV files found in ${audioFilesDir}`);
    process.exit(1);
  }

  console.log(`  Found ${wavFiles.length} track(s):`);
  wavFiles.forEach(f => console.log(`    - ${basename(f)}`));

  const inputs = wavFiles.map(f => `-i "${f}"`).join(' ');
  const n = wavFiles.length;

  // amix: mix all tracks with equal volume, normalize to prevent clipping
  const filter = n === 1
    ? '[0:a]acopy[out]'
    : `[${wavFiles.map((_, i) => `${i}:a`).join('][')}]amix=inputs=${n}:duration=longest:normalize=1[out]`;

  run(`ffmpeg -y ${inputs} -filter_complex "${filter}" -map "[out]" -q:a 2 "${outputMp3}"`);
  console.log(`  ✓ Mixed to ${outputMp3}`);
  return outputMp3;
}

// ─── Step 1: Audio processing (ducked intro/outro beds + normalize) ──────────
//
// Design:
//   INTRO BED  — music starts simultaneously with speech at low volume (-18 dB),
//                fades in over 3 s, holds for 20 s, then fades out over 8 s.
//                Listener hears voice immediately with subtle music underneath.
//
//   OUTRO BED  — split into two overlapping parts, crossfaded at the speech-end boundary:
//     Part 1 (under speech): fades in 5 s before the speech winds down, sits at
//                            -20 dB, fades out as speech ends.
//     Part 2 (after speech): overlaps Part 1 by XFADE seconds, fades in to -10 dB,
//                            plays POST_ROLL seconds after speech, then fades out.
//   Result: a smooth musical swell that lifts from under the speech, peaks just
//           after the last word, then fades away naturally.

function processAudio(opts, inputMp3, outputMp3) {
  // ── Tuning ──────────────────────────────────────────────────────────────────
  const INTRO_PEAK_VOL  = 0.10;   // -20 dB  — brief opening hit
  const INTRO_FADE_IN   = 2;      // s — fade in to peak
  const INTRO_PEAK_DUR  = 2;      // s — hold at peak volume
  const INTRO_DUCK_DUR  = 3;      // s — smooth duck from peak down to bed
  const INTRO_BED_VOL   = 0.040;  // -28 dB  — settled bed under speech
  const INTRO_BED_DUR   = 15;     // s — start fade-out at this point
  const INTRO_FADE_OUT  = 32;     // s — long gradual fade out

  const OUTRO_PRE_VOL   = 0.100;  // -20 dB  — barely audible under speech
  const OUTRO_POST_VOL  = 0.316;  // -10 dB  — noticeable after speech ends
  const OUTRO_FADE_IN   = 5;      // s — fade in at outro entry
  const OUTRO_POST_ROLL = 10;     // s — outro plays this long after speech ends
  const OUTRO_XFADE     = 2;      // s — crossfade half-width at speech-end boundary
  const OUTRO_FADE_OUT  = 5;      // s — final fade to silence
  // ────────────────────────────────────────────────────────────────────────────

  console.log('\n▶ Step 1: Audio processing (ducked beds + dynaudnorm)');

  const hasIntro = existsSync(opts.intro);
  const hasOutro = existsSync(opts.outro);
  if (!hasIntro) console.warn(`  ⚠ Intro not found: ${opts.intro} — skipping`);
  if (!hasOutro) console.warn(`  ⚠ Outro not found: ${opts.outro} — skipping`);

  const speechDur = getAudioDuration(inputMp3);
  const introDur  = hasIntro ? getAudioDuration(opts.intro) : 0;
  const outroDur  = hasOutro ? getAudioDuration(opts.outro) : 0;

  // Normalize speech FIRST so dynaudnorm never sees the quiet music-only sections.
  // Music beds are then mixed in at fixed levels on top of the normalized speech.
  const normalizedSpeech = outputMp3 + '.normspeech.mp3';
  console.log('  Normalizing speech (dynaudnorm, mono)...');
  run(`ffmpeg -y -i "${inputMp3}" -ac 1 -af "dynaudnorm=p=1/sqrt(2):m=100:s=12:g=3" -q:a 2 "${normalizedSpeech}"`);

  // Fast path: no music at all
  if (!hasIntro && !hasOutro) {
    run(`mv "${normalizedSpeech}" "${outputMp3}"`);
    return;
  }

  const inputs  = [`-i "${normalizedSpeech}"`];
  const filters = [`[0:a]acopy[speech]`];
  const streams = ['[speech]'];
  let idx = 1;

  // ── INTRO BED ──────────────────────────────────────────────────────────────
  // Envelope: fade-in → peak hold → smooth duck to bed → long fade-out
  if (hasIntro) {
    inputs.push(`-i "${opts.intro}"`);

    // Time points for the volume envelope
    const t1 = INTRO_FADE_IN;                          // peak reached
    const t2 = t1 + INTRO_PEAK_DUR;                    // duck starts
    const t3 = t2 + INTRO_DUCK_DUR;                    // bed level reached
    const t4 = INTRO_BED_DUR;                          // fade-out starts
    const t5 = t4 + INTRO_FADE_OUT;                    // silence
    const trimEnd = Math.min(introDur, t5 + 0.5);

    // Piecewise volume expression (t is stream time in seconds):
    //   [0,  t1]: ramp 0 → PEAK_VOL  (fade in)
    //   [t1, t2]: hold PEAK_VOL       (peak)
    //   [t2, t3]: ramp PEAK→BED       (duck)
    //   [t3, t4]: hold BED_VOL        (bed)
    //   [t4, t5]: ramp BED→0          (fade out)
    const dv = INTRO_BED_VOL - INTRO_PEAK_VOL;         // negative (ducking down)
    const volExpr =
      `if(lt(t,${t1}), ${INTRO_PEAK_VOL}*t/${t1},` +
      `if(lt(t,${t2}), ${INTRO_PEAK_VOL},` +
      `if(lt(t,${t3}), ${INTRO_PEAK_VOL}+${dv}*(t-${t2})/${INTRO_DUCK_DUR},` +
      `if(lt(t,${t4}), ${INTRO_BED_VOL},` +
      `if(lt(t,${t5}), ${INTRO_BED_VOL}*(${t5}-t)/${INTRO_FADE_OUT},` +
      `0)))))`;

    filters.push(
      `[${idx}:a]` +
      `volume=eval=frame:volume='${volExpr}',` +
      `atrim=0:${trimEnd},asetpts=PTS-STARTPTS` +
      `[intro_bed]`
    );
    streams.push('[intro_bed]');
    idx++;
    console.log(`  Intro: peak ${INTRO_PEAK_DUR}s @ -${Math.round(-20*Math.log10(INTRO_PEAK_VOL))} dB → duck to -${Math.round(-20*Math.log10(INTRO_BED_VOL))} dB bed → fade out at ${t4}s`);
  }

  // ── OUTRO BED ──────────────────────────────────────────────────────────────
  // Timed so the outro ends POST_ROLL seconds after speech ends.
  // Split into Part 1 (under speech, quiet) and Part 2 (after speech, louder),
  // crossfaded across the speech-end boundary.
  if (hasOutro) {
    inputs.push(`-i "${opts.outro}"`);

    // Seconds of outro that play *before* speech ends
    const preRoll    = Math.max(0, outroDur - OUTRO_POST_ROLL);
    // Absolute time in the episode when the outro starts
    const outroDelay = Math.max(0, speechDur - preRoll);
    // Time within the outro track at which speech ends
    const seAt       = speechDur - outroDelay; // ≈ preRoll

    // Part 1: [0, seAt + XFADE] — quiet, fades out into the crossfade
    const p1End          = Math.min(seAt + OUTRO_XFADE, outroDur);
    const p1FadeOutStart = Math.max(0, seAt - OUTRO_XFADE);
    const p1DelayMs      = Math.round(outroDelay * 1000);

    // Part 2: [seAt - XFADE, end] — louder, fades in from the crossfade
    const p2Start        = Math.max(0, seAt - OUTRO_XFADE);
    const p2Dur          = outroDur - p2Start;
    const p2FadeOutStart = Math.max(0, p2Dur - OUTRO_FADE_OUT);
    const p2DelayMs      = Math.round((outroDelay + p2Start) * 1000);

    filters.push(`[${idx}:a]asplit=2[outro_raw1][outro_raw2]`);

    // Part 1: quiet bed under speech, fades out
    filters.push(
      `[outro_raw1]` +
      `atrim=0:${p1End},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${OUTRO_FADE_IN},` +
      `volume=${OUTRO_PRE_VOL},` +
      `afade=t=out:st=${p1FadeOutStart}:d=${OUTRO_XFADE * 2},` +
      `adelay=${p1DelayMs}:all=1` +
      `[outro_p1]`
    );

    // Part 2: louder swell after speech ends, then fades out
    filters.push(
      `[outro_raw2]` +
      `atrim=${p2Start},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${OUTRO_XFADE * 2},` +
      `volume=${OUTRO_POST_VOL},` +
      `afade=t=out:st=${p2FadeOutStart}:d=${OUTRO_FADE_OUT},` +
      `adelay=${p2DelayMs}:all=1` +
      `[outro_p2]`
    );

    streams.push('[outro_p1]', '[outro_p2]');
    idx++;

    const preRollMin = `${Math.floor(outroDelay / 60)}:${String(Math.floor(outroDelay % 60)).padStart(2,'0')}`;
    console.log(`  Outro: enters at ${preRollMin} (${preRoll.toFixed(1)}s before speech ends), swells after, ${OUTRO_POST_ROLL}s post-roll`);
  }

  // ── MIX ────────────────────────────────────────────────────────────────────
  const n = streams.length;
  filters.push(`${streams.join('')}amix=inputs=${n}:duration=longest:normalize=0[out]`);

  run(`ffmpeg -y ${inputs.join(' ')} -filter_complex "${filters.join('; ')}" -map "[out]" -q:a 2 "${outputMp3}"`);

  try { run(`rm -f "${normalizedSpeech}"`, { silent: true }); } catch {}
  console.log(`  ✓ Processed audio → ${outputMp3}`);
}

// ─── Step 2a: Transcription via ivrit.ai (RunPod / Whisper) ─────────────────

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

async function transcribeIvrit(opts, audioFile, audioUrl, transcriptFile) {
  console.log('\n▶ Step 2: Transcription via ivrit.ai (Hebrew Whisper)');

  const apiKey    = process.env.RUNPOD_API_KEY;
  const endpointId = process.env.RUNPOD_ENDPOINT_ID;
  if (!apiKey)     { console.error('  ✗ RUNPOD_API_KEY is required'); process.exit(1); }
  if (!endpointId) { console.error('  ✗ RUNPOD_ENDPOINT_ID is required'); process.exit(1); }

  // ivrit needs a public URL — ensure the file is uploaded to S3 first
  console.log(`  Checking if ${audioUrl} is accessible...`);
  let urlReady = false;
  try {
    const r = await fetch(audioUrl, { method: 'HEAD' });
    urlReady = r.ok;
  } catch {}

  if (!urlReady) {
    console.log('  File not yet on S3 — uploading now...');
    uploadToS3(audioFile, opts.bucket, audioUrl.split('/').pop());
  }

  // Submit job to RunPod
  console.log('  Submitting transcription job to RunPod...');
  const submitResp = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        engine: 'faster-whisper',
        model: 'ivrit-ai/whisper-large-v3-turbo-ct2',
        streaming: false,
        transcribe_args: { url: audioUrl, language: 'he', diarize: true },
        output_options: { word_timestamps: false },
      },
    }),
  });

  if (!submitResp.ok) {
    console.error(`  ✗ RunPod submit failed: ${submitResp.status} ${await submitResp.text()}`);
    process.exit(1);
  }

  const { id: jobId } = await submitResp.json();
  console.log(`  Job ID: ${jobId}`);

  // Poll until complete
  let dots = 0;
  while (true) {
    await new Promise(r => setTimeout(r, 8000));
    const statusResp = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const status = await statusResp.json();

    if (status.status === 'COMPLETED') {
      console.log('\n  Processing complete.');
      const transcript = formatIvritTranscript(status.output);
      writeFileSync(transcriptFile, transcript, 'utf8');
      console.log(`  ✓ Transcript (${transcript.length.toLocaleString()} chars) → ${transcriptFile}`);
      return transcript;
    } else if (status.status === 'FAILED') {
      console.error(`\n  ✗ Transcription failed: ${JSON.stringify(status.error)}`);
      process.exit(1);
    }

    process.stdout.write(++dots % 10 === 0 ? `\n  ` : '.');
  }
}

function formatIvritTranscript(output) {
  // output.result is an array of {type, data} events; collect all segment arrays
  const events = Array.isArray(output) ? output : (output?.result ?? []);
  const lines = [];

  for (const event of events) {
    if (event.type !== 'segments') continue;
    for (const seg of event.data) {
      const time    = formatTimestamp(seg.start);
      const speaker = seg.speakers?.[0] ?? 'דובר';
      lines.push(`[${time}] **${speaker}**: ${seg.text.trim()}`);
    }
  }

  return lines.join('\n');
}

// ─── Step 2b: Transcription via Gemini ───────────────────────────────────────

async function transcribe(opts, audioFile, transcriptFile) {
  console.log('\n▶ Step 2: Transcription via Gemini 3 Pro');

  let GoogleGenerativeAI, GoogleAIFileManager, FileState;
  try {
    ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
    ({ GoogleAIFileManager, FileState } = await import('@google/generative-ai/server'));
  } catch {
    console.error('  ✗ @google/generative-ai not installed. Run: npm install --save-dev @google/generative-ai');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('  ✗ GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }

  const fileManager = new GoogleAIFileManager(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);

  const fileSizeMB = (parseInt(runCapture(`stat -f%z "${audioFile}"`).trim()) / 1024 / 1024).toFixed(1);
  console.log(`  Uploading ${basename(audioFile)} (${fileSizeMB} MB) to Gemini File API...`);

  const uploadResult = await fileManager.uploadFile(audioFile, {
    mimeType: 'audio/mp3',
    displayName: `Reversim ${opts.episode} - ${opts.title}`,
  });

  console.log(`  Waiting for Gemini to process the file...`);
  let file = await fileManager.getFile(uploadResult.file.name);
  while (file.state === FileState.PROCESSING) {
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 8000));
    file = await fileManager.getFile(uploadResult.file.name);
  }
  if (file.state === FileState.FAILED) throw new Error('Gemini file processing failed');
  console.log(' done.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

  const prompt = `This is a Hebrew-language technology podcast episode called "רברס עם פלטפורמה" (Reversim Podcast), episode ${opts.episode}: "${opts.title}".

Provide a complete, detailed transcript in Hebrew.

Rules:
- Include timestamps at every speaker change and topic shift, in [MM:SS] format
- Identify speakers: the regular hosts are רן (Ran) and אורי (Ori); identify guests from context
- Reproduce all technical terms, product names, and company names exactly as spoken
- Do NOT summarize — provide the complete verbatim transcript

Format each line as:
[MM:SS] **Speaker name**: text`;

  console.log('  Requesting transcription...');
  const result = await model.generateContent([
    { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
    { text: prompt },
  ]);

  const transcript = result.response.text();
  writeFileSync(transcriptFile, transcript, 'utf8');
  console.log(`  ✓ Transcript (${transcript.length.toLocaleString()} chars) → ${transcriptFile}`);

  try { await fileManager.deleteFile(uploadResult.file.name); } catch {}

  return transcript;
}

// ─── Step 3: Generate blog post ───────────────────────────────────────────────

async function generatePost(opts, transcript, audioUrl) {
  console.log('\n▶ Step 3: Generating Hebrew blog post');

  let GoogleGenerativeAI;
  try {
    ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
  } catch {
    console.error('  ✗ @google/generative-ai not installed.');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error('  ✗ GEMINI_API_KEY is required'); process.exit(1); }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

  const tagsHint = opts.tags.length ? `\nTags: ${opts.tags.join(', ')}` : '';

  const prompt = `You are a content writer for "רברס עם פלטפורמה" (Reversim Podcast), a Hebrew-language technology podcast.

Write the body of a structured Hebrew blog post for episode ${opts.episode}: "${opts.title}".${tagsHint}

Requirements:
- Write entirely in Hebrew (RTL)
- Start with a 2–3 sentence intro naming the hosts and guest(s)
- Divide into timestamped sections: **[MM:SS] Section Title in Hebrew**
- Use bullet points for discussion points; start sub-points with nested bullets
- Add hyperlinks for companies, products, and articles only when you are certain of the URL (e.g. official websites, well-known domains). Do NOT guess or infer LinkedIn or social media profile URLs for people — leave names as plain text
- Conversational, engaging style — tech-savvy Israeli audience
- End with: "האזנה נעימה!"
- Output only the Markdown body — NO frontmatter YAML

Style reference (follow this exact format):
---
פרק מספר 512 של רברס עם פלטפורמה - קרבורטור מספר 40.

**[01:58] "משהו גדול קורה"**

* [Matt Shumer](https://x.com/mattshumer_) כתב בלוג-פוסט שהיכה גלים — מעבר מסקפטיות מוחלטת לעולם שבו ה-agent עושה את כל עבודת הקידוד.
* נתי - ניתוח שוק העבודה: "הכתובת היא כבר בכיס כמעט".

  * ירידה משמעותית ב-Hiring שהתחילה ב-2025.

**[10:17] עידן ה-Agents**

* נתי - "Professional Agents": מומחים מוכרים את עצמם כסוכנים.

האזנה נעימה!
---

TRANSCRIPT:
${transcript}`;

  console.log('  Calling Gemini to write the post...');
  const result = await model.generateContent(prompt);
  const body = result.response.text();

  // Build frontmatter
  const [year, month] = opts.date.split('-');
  const tagsYaml = opts.tags.length
    ? '\ntags:\n' + opts.tags.map(t => `  - ${t}`).join('\n')
    : '';

  const coverImage = opts.coverImage ? `\ncover_image: ${opts.coverImage}` : '\n# cover_image: /images/TODO.png';

  const frontmatter =
    `---\n` +
    `title: "${opts.episode} - ${opts.title}"\n` +
    `date: ${opts.date}T00:00:00.000Z\n` +
    `episode: ${opts.episode}\n` +
    `audio_url: ${audioUrl}${tagsYaml}${coverImage}\n` +
    `---\n`;

  const postContent = frontmatter + '\n' + body;

  const postFilename = `${year}-${month}-${opts.episode}-${opts.slug}.md`;
  const postPath = join(REPO_ROOT, 'src/content/posts', postFilename);

  if (existsSync(postPath)) {
    console.log(`  Overwriting existing post: ${postPath}`);
  }

  writeFileSync(postPath, postContent, 'utf8');
  console.log(`  ✓ Blog post → ${postPath}`);
  return postPath;
}

// ─── Step 4: S3 upload ───────────────────────────────────────────────────────
// ─── Step 5: Generate social media posts ─────────────────────────────────────

async function generateSocial(opts, postContent, postUrl, socialFile) {
  console.log('\n▶ Step 5: Generating social media posts');

  let GoogleGenerativeAI;
  try {
    ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
  } catch {
    console.error('  ✗ @google/generative-ai not installed.');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error('  ✗ GEMINI_API_KEY is required'); process.exit(1); }

  const systemPrompt = readFileSync(join(__dirname, 'SOCIAL.md'), 'utf8');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    systemInstruction: systemPrompt,
  });

  const prompt =
    `Blog post URL: ${postUrl}\n\n` +
    `Blog post content (use this since the site may not be deployed yet):\n\n${postContent}`;

  console.log('  Calling Gemini to write social posts...');
  const result = await model.generateContent(prompt);
  const social = result.response.text();

  writeFileSync(socialFile, social, 'utf8');
  console.log(`  ✓ Social posts → ${socialFile}`);
  return social;
}



function uploadToS3(localFile, bucket, s3Key) {
  console.log('\n▶ Step 4: Uploading to S3');
  const s3Uri = `s3://${bucket}/${s3Key}`;
  run(`aws s3 cp "${localFile}" "${s3Uri}" --profile reversim`);
  const audioUrl = `https://m2.reversim.com/${s3Key}`;
  console.log(`  ✓ Live at ${audioUrl}`);
  return audioUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  mkdirSync(opts.workdir, { recursive: true });

  const fileSlug = opts.slug.replace(/-/g, '_');
  const mp3Name   = `reversim${opts.episode}-${fileSlug}.mp3`;
  const mixedMp3  = join(opts.workdir, `_mixed_${opts.episode}.mp3`);
  const outputMp3 = join(opts.workdir, mp3Name);
  const transcriptFile = join(opts.workdir, `reversim${opts.episode}-${fileSlug}.transcript.md`);
  const audioUrl = `https://m2.reversim.com/${mp3Name}`;

  console.log(`\n🎙  Reversim Podcast — Episode ${opts.episode}: ${opts.title}`);
  console.log(`    Date:  ${opts.date}`);
  console.log(`    MP3:   ${mp3Name}`);
  console.log(`    URL:   ${audioUrl}`);
  if (opts.intro) console.log(`    Intro: ${existsSync(opts.intro) ? '✓' : '✗ not found'} ${opts.intro}`);
  if (opts.outro) console.log(`    Outro: ${existsSync(opts.outro) ? '✓' : '✗ not found'} ${opts.outro}`);

  // Determine the raw recording to use
  let rawInput = opts.input;

  // Step 0: Mix WAVs (if --mix-wavs given)
  if (opts.mixWavs) {
    if (!opts.skipMix) {
      if (existsSync(mixedMp3)) {
        console.log(`\n▶ Step 0: Using existing mix (${mixedMp3})`);
      } else {
        mixWavTracks(opts.mixWavs, mixedMp3);
      }
      rawInput = mixedMp3;
    } else {
      console.log('\n▶ Step 0: Skipped (--skip-mix)');
      rawInput = existsSync(mixedMp3) ? mixedMp3 : opts.input;
    }
  }

  if (!rawInput || !existsSync(rawInput)) {
    console.error(`\n✗ No usable input file found (tried: ${rawInput})`);
    process.exit(1);
  }

  // Step 1: Intro/outro + normalize
  if (!opts.skipAudio) {
    if (existsSync(outputMp3)) {
      console.log(`\n▶ Step 1: Skipping (output already exists: ${outputMp3})`);
    } else {
      processAudio(opts, rawInput, outputMp3);
    }
  } else {
    console.log('\n▶ Step 1: Skipped (--skip-audio)');
  }

  // Step 2: Transcribe
  let transcript = '';
  if (!opts.skipTranscribe) {
    if (existsSync(transcriptFile)) {
      console.log(`\n▶ Step 2: Loading existing transcript (${basename(transcriptFile)})`);
      transcript = readFileSync(transcriptFile, 'utf8');
    } else {
      const audioForTranscription = existsSync(outputMp3) ? outputMp3 : rawInput;
      if (opts.transcriber === 'ivrit') {
        transcript = await transcribeIvrit(opts, audioForTranscription, audioUrl, transcriptFile);
      } else {
        transcript = await transcribe(opts, audioForTranscription, transcriptFile);
      }
    }
  } else {
    console.log('\n▶ Step 2: Skipped (--skip-transcribe)');
    if (existsSync(transcriptFile)) transcript = readFileSync(transcriptFile, 'utf8');
  }

  // Step 3: Blog post
  if (!opts.skipPost) {
    if (!transcript) {
      console.warn('\n▶ Step 3: No transcript available — run without --skip-transcribe first');
    } else {
      if (!opts.coverImage) {
        const answer = await promptCoverImage();
        if (answer && answer.startsWith('http')) {
          const ext = answer.split('?')[0].split('.').pop();
          const filename = `ep${opts.episode}-cover.${ext}`;
          const dest = join(REPO_ROOT, 'public/images', filename);
          console.log(`  Downloading cover image → public/images/${filename}`);
          run(`curl -sL "${answer}" -o "${dest}"`);
          opts.coverImage = `/images/${filename}`;
        } else {
          opts.coverImage = answer;
        }
      }
      await generatePost(opts, transcript, audioUrl);
    }
  } else {
    console.log('\n▶ Step 3: Skipped (--skip-post)');
  }

  // Step 4: Upload
  if (!opts.skipUpload) {
    if (!existsSync(outputMp3)) {
      console.error(`\n✗ Processed MP3 not found: ${outputMp3}`);
      process.exit(1);
    }
    uploadToS3(outputMp3, opts.bucket, mp3Name);
  } else {
    console.log('\n▶ Step 4: Skipped (--skip-upload)');
  }

  // Step 5: Social media posts
  const [year, month] = opts.date.split('-');
  const postFilename = `${year}-${month}-${opts.episode}-${opts.slug}.md`;
  const postPath = join(REPO_ROOT, 'src/content/posts', postFilename);
  const socialFile = join(opts.workdir, `reversim${opts.episode}-${fileSlug}.social.md`);

  if (!opts.skipSocial) {
    if (!existsSync(postPath)) {
      console.warn('\n▶ Step 5: No blog post found — run produce-post first');
    } else {
      const postContent = readFileSync(postPath, 'utf8');
      const postUrl = `https://www.reversim.com/${year}/${month}/${opts.episode}-${opts.slug}.html`;
      await generateSocial(opts, postContent, postUrl, socialFile);
    }
  } else {
    console.log('\n▶ Step 5: Skipped (--skip-social)');
  }

  const durationSec = existsSync(outputMp3) ? getAudioDuration(outputMp3) : 0;
  const durationMin = durationSec ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}` : 'unknown';

  console.log('\n✅ Done!');
  console.log(`   Audio URL:  ${audioUrl}`);
  console.log(`   Duration:   ${durationMin}`);
  console.log(`   Transcript: ${transcriptFile}`);
  console.log(`   Social:     ${socialFile}`);
  console.log(`   Workdir:    ${opts.workdir}`);
}

main().catch(err => {
  console.error('\n✗', err.message || err);
  process.exit(1);
});
