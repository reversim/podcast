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
    skipMix: false,
    skipAudio: false,
    skipTranscribe: false,
    skipPost: false,
    skipUpload: false,
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
      case '--skip-mix':                  opts.skipMix = true; break;
      case '--skip-audio':                opts.skipAudio = true; break;
      case '--skip-transcribe':           opts.skipTranscribe = true; break;
      case '--skip-post':                 opts.skipPost = true; break;
      case '--skip-upload':               opts.skipUpload = true; break;
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

// ─── Step 1: Audio processing (intro/outro + normalize) ──────────────────────

function processAudio(opts, inputMp3, outputMp3) {
  console.log('\n▶ Step 1: Audio processing (intro/outro + loudnorm)');

  const hasIntro = existsSync(opts.intro);
  const hasOutro = existsSync(opts.outro);

  if (!hasIntro) console.warn(`  ⚠ Intro not found: ${opts.intro} — skipping`);
  if (!hasOutro) console.warn(`  ⚠ Outro not found: ${opts.outro} — skipping`);

  const fadedMp3 = outputMp3 + '.prefade.mp3';

  if (hasIntro || hasOutro) {
    const inputs = [];
    const filterParts = [];
    let idx = 0;

    if (hasIntro) {
      const introDur = getAudioDuration(opts.intro);
      const fadeInDur = Math.min(2, introDur);
      inputs.push(`-i "${opts.intro}"`);
      filterParts.push(`[${idx}]afade=t=in:st=0:d=${fadeInDur}[a${idx}]`);
      idx++;
    }

    inputs.push(`-i "${inputMp3}"`);
    filterParts.push(`[${idx}]acopy[a${idx}]`);
    idx++;

    if (hasOutro) {
      const outroDur = getAudioDuration(opts.outro);
      const fadeOutStart = Math.max(0, outroDur - 3);
      inputs.push(`-i "${opts.outro}"`);
      filterParts.push(`[${idx}]afade=t=out:st=${fadeOutStart}:d=3[a${idx}]`);
      idx++;
    }

    const concatInputs = Array.from({ length: idx }, (_, i) => `[a${i}]`).join('');
    const filter = [
      ...filterParts,
      `${concatInputs}concat=n=${idx}:v=0:a=1[out]`,
    ].join('; ');

    run(`ffmpeg -y ${inputs.join(' ')} -filter_complex "${filter}" -map "[out]" -q:a 2 "${fadedMp3}"`);
  } else {
    run(`ffmpeg -y -i "${inputMp3}" -c copy "${fadedMp3}"`);
  }

  // Normalize: convert to mono + dynamic audio normalization (matches existing Reversim workflow)
  console.log('  Normalizing audio (dynaudnorm, mono)...');
  run(
    `ffmpeg -y -i "${fadedMp3}" -ac 1 ` +
    `-af "dynaudnorm=p=1/sqrt(2):m=100:s=12:g=3" ` +
    `-q:a 2 "${outputMp3}"`
  );

  // Remove intermediate file
  try { run(`rm -f "${fadedMp3}"`, { silent: true }); } catch {}

  console.log(`  ✓ Processed audio → ${outputMp3}`);
}

// ─── Step 2: Transcription via Gemini ────────────────────────────────────────

async function transcribe(opts, audioFile, transcriptFile) {
  console.log('\n▶ Step 2: Transcription via Gemini 1.5 Pro');

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

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const tagsHint = opts.tags.length ? `\nTags: ${opts.tags.join(', ')}` : '';

  const prompt = `You are a content writer for "רברס עם פלטפורמה" (Reversim Podcast), a Hebrew-language technology podcast.

Write the body of a structured Hebrew blog post for episode ${opts.episode}: "${opts.title}".${tagsHint}

Requirements:
- Write entirely in Hebrew (RTL)
- Start with a 2–3 sentence intro naming the hosts and guest(s)
- Divide into timestamped sections: **[MM:SS] Section Title in Hebrew**
- Use bullet points for discussion points; start sub-points with nested bullets
- Add hyperlinks for mentioned people (LinkedIn), companies, products, and articles when URLs can be inferred
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

  const frontmatter =
    `---\n` +
    `title: "${opts.episode} - ${opts.title}"\n` +
    `date: ${opts.date}T00:00:00.000Z\n` +
    `episode: ${opts.episode}\n` +
    `audio_url: ${audioUrl}${tagsYaml}\n` +
    `---\n`;

  const postContent = frontmatter + '\n' + body;

  const postFilename = `${year}-${month}-${opts.episode}-${opts.slug}.md`;
  const postPath = join(REPO_ROOT, 'src/content/posts', postFilename);

  const finalPath = existsSync(postPath) ? postPath + '.new.md' : postPath;
  if (existsSync(postPath)) {
    console.warn(`  ⚠ ${postPath} already exists — writing to ${finalPath}`);
  }

  writeFileSync(finalPath, postContent, 'utf8');
  console.log(`  ✓ Blog post → ${finalPath}`);
  return finalPath;
}

// ─── Step 4: S3 upload ───────────────────────────────────────────────────────

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
      transcript = await transcribe(opts, audioForTranscription, transcriptFile);
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

  const durationSec = existsSync(outputMp3) ? getAudioDuration(outputMp3) : 0;
  const durationMin = durationSec ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}` : 'unknown';

  console.log('\n✅ Done!');
  console.log(`   Audio URL:  ${audioUrl}`);
  console.log(`   Duration:   ${durationMin}`);
  console.log(`   Transcript: ${transcriptFile}`);
  console.log(`   Workdir:    ${opts.workdir}`);
}

main().catch(err => {
  console.error('\n✗', err.message || err);
  process.exit(1);
});
