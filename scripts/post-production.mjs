#!/usr/bin/env node
/**
 * Podcast post-production automation for Reversim Podcast
 *
 * Steps:
 *   0. (Optional) Process the raw WAV tracks of a GarageBand project with the GarageBand patch of each speaker
 *      (EQ, compressors, de-esser) and mix them
 *   1. Level the speech to -16 LUFS and add intro/outro with fade-in/out via ffmpeg
 *   2. Transcribe via Gemini File API (handles 30–90 min files)
 *   2b. Cold open: an LLM picks 2–3 strong quotes, ffmpeg puts them before the intro
 *   3. Generate Hebrew blog post from transcript
 *   4. Upload processed MP3 to Cloudflare R2 (served by m2.reversim.com) and S3 (backup)
 *   5. Generate social media posts (Twitter, LinkedIn, Facebook)
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
 *   --title, -t        Episode title (required). The blog title is Hebrew: an English title is translated,
 *                      a Hebrew title is used as it is. The post title is "<episode>: <Hebrew title>".
 *   --date, -d         Date YYYY-MM-DD (default: today)
 *   --slug, -s         URL slug (auto-derived from episode number if not provided)
 *   --intro            Intro MP3 (default: $REVERSIM_INTRO or assets/intro.mp3)
 *   --welcome          Recorded welcome line that plays over the intro music, before the hosts
 *                      (default: $REVERSIM_WELCOME or assets/welcome.wav; no file = no welcome)
 *   --outro            Outro MP3 (default: $REVERSIM_OUTRO or assets/outro.mp3)
 *   --signoff          Recorded sign-off line (share, follow, rate) that plays over the outro music,
 *                      after the goodbyes (default: $REVERSIM_SIGNOFF or assets/signoff.wav; no file = no sign-off)
 *   --patches DIR      GarageBand patches for --mix-wavs (default: $REVERSIM_PATCHES or assets/patches).
 *                      <Speaker>.patch for the track <Speaker>#01.wav, default.patch for other speakers.
 *   --bucket, -b       Bucket name, used for both R2 and S3 (default: reversim)
 *   --workdir          Working directory for intermediate files (default: cwd)
 *   --tags             Comma-separated tags
 *   --transcript PATH  Use this transcript file instead of running Gemini transcription
 *   --notes            Episode notes: Google Doc URL (must be publicly shared)
 *                      or local file path (text, Markdown or Word .docx). All links from the notes will be
 *                      embedded inline in the blog post at the matching topic.
 *   --cold-open MODE   ask (default in a terminal): show the quotes and ask for approval
 *                      auto: use the selected quotes without a question
 *                      off (default without a terminal): no cold open
 *   --skip-mix         Skip WAV mixing step
 *   --skip-audio       Skip intro/outro/normalize step
 *   --skip-transcribe  Skip Gemini transcription step
 *   --skip-post        Skip blog post generation step
 *   --skip-upload      Skip the R2 + S3 upload step
 *   --skip-checks      Do not stop on a failed episode-number guard or quality gate (the result is still shown)
 *
 * Environment variables:
 *   GEMINI_API_KEY        Google Gemini API key (required for transcription/post steps)
 *   REVERSIM_INTRO        Default path to intro MP3
 *   REVERSIM_OUTRO        Default path to outro MP3
 *   AWS_PROFILE           AWS profile for the S3 backup upload (optional; code uses --profile reversim)
 *   R2_ACCOUNT_ID         Cloudflare account id for the R2 S3-compatible endpoint (required for upload)
 *   R2_ACCESS_KEY_ID      R2 S3-API access key id (required for upload)
 *   R2_SECRET_ACCESS_KEY  R2 S3-API secret access key (required for upload)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync, renameSync } from 'fs';
import { resolve, dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

import { loadMeta, saveMeta } from './audio-meta.mjs';

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
    patches: process.env.REVERSIM_PATCHES || join(REPO_ROOT, 'assets/patches'),
    welcome: process.env.REVERSIM_WELCOME || join(REPO_ROOT, 'assets/welcome.wav'),
    signoff: process.env.REVERSIM_SIGNOFF || join(REPO_ROOT, 'assets/signoff.wav'),
    bucket: 'reversim',
    workdir: process.cwd(),
    tags: [],
    coverImage: null,
    notes: null,
    transcript: null,
    transcriber: 'gemini',  // 'gemini' or 'ivrit' (ivrit requires RunPod)
    coldOpen: process.stdin.isTTY ? 'ask' : 'off',  // 'ask' | 'auto' | 'off'
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
      case '--welcome':                   opts.welcome = resolve(args[++i]); break;
      case '--intro':                     opts.intro = resolve(args[++i]); break;
      case '--signoff':                   opts.signoff = resolve(args[++i]); break;
      case '--outro':                     opts.outro = resolve(args[++i]); break;
      case '--patches':                   opts.patches = resolve(args[++i]); break;
      case '--bucket':         case '-b': opts.bucket = args[++i]; break;
      case '--workdir':                   opts.workdir = resolve(args[++i]); break;
      case '--tags':                      opts.tags = args[++i].split(',').map(t => t.trim()); break;
      case '--cover-image':               opts.coverImage = args[++i]; break;
      case '--notes':                     opts.notes = args[++i]; break;
      case '--transcript':                opts.transcript = resolve(args[++i]); break;
      case '--transcriber':               opts.transcriber = args[++i]; break;
      case '--cold-open':                 opts.coldOpen = args[++i]; break;
      case '--skip-mix':                  opts.skipMix = true; break;
      case '--skip-audio':                opts.skipAudio = true; break;
      case '--skip-transcribe':           opts.skipTranscribe = true; break;
      case '--skip-post':                 opts.skipPost = true; break;
      case '--skip-upload':               opts.skipUpload = true; break;
      case '--skip-checks':               opts.skipChecks = true; break;
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
  if (!['ask', 'auto', 'off'].includes(opts.coldOpen)) { console.error('--cold-open must be ask, auto or off'); process.exit(1); }
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

  // Bumpers episodes: auto-add the bumpers tag and default cover image
  const isBumpers = /bumpers/i.test(opts.title) || /bumpers/i.test(opts.slug);
  if (isBumpers) {
    if (!opts.tags.includes('bumpers')) opts.tags.push('bumpers');
    if (!opts.coverImage) opts.coverImage = '/images/blogger/bumpers.png';
  }

  return opts;
}

// ─── Cost tracking ───────────────────────────────────────────────────────────

// Pricing per 1M tokens — source: https://ai.google.dev/gemini-api/docs/pricing
// Audio input: 25 tokens/second (e.g. 90-min episode = 135k tokens = ~$0.27)
// Long context (>200k tokens): $4.00 in / $18.00 out
const GEMINI_MODEL = 'gemini-3.1-pro-preview';

// Constant bit rate: players calculate the duration and the seek position exactly (VBR files can show both wrong).
const MP3_ENCODE = '-c:a libmp3lame -b:a 128k';
// LAME at 128 kbps constant bit rate scales the signal by 0.95 (-0.45 dB) on each encode. This filter goes last
// in the chain before each encode and cancels that, so the loudness and the peak stay as the limiter set them.
const MP3_SCALE_FIX = 'volume=1.0526';
const SHOW_NAME = 'רברס עם פלטפורמה';
const SHOW_COVER = join(REPO_ROOT, 'public/podcast-cover.png');
const GEMINI_PRICING = {
  'gemini-3.1-pro-preview': { inputPerM: 2.00, outputPerM: 12.00 },
  'gemini-3-pro-preview':  { inputPerM: 2.00, outputPerM: 12.00 },
  'gemini-2.5-pro-preview': { inputPerM: 2.00, outputPerM: 12.00 },
  'gemini-1.5-pro':         { inputPerM: 1.25, outputPerM: 5.00  },
};

const _costAccumulator = { inputTokens: 0, outputTokens: 0, totalUsd: 0 };

function reportUsage(label, usageMeta, modelName) {
  if (!usageMeta) return;
  // Thinking tokens cost the same as output tokens.
  const { promptTokenCount = 0 } = usageMeta;
  const candidatesTokenCount = (usageMeta.candidatesTokenCount ?? 0) + (usageMeta.thoughtsTokenCount ?? 0);
  const pricing = GEMINI_PRICING[modelName] ?? { inputPerM: 1.25, outputPerM: 10.00 };
  const costUsd = (promptTokenCount / 1e6) * pricing.inputPerM +
                  (candidatesTokenCount / 1e6) * pricing.outputPerM;

  _costAccumulator.inputTokens  += promptTokenCount;
  _costAccumulator.outputTokens += candidatesTokenCount;
  _costAccumulator.totalUsd     += costUsd;

  console.log(
    `  💰 ${label}: ${promptTokenCount.toLocaleString()} in + ${candidatesTokenCount.toLocaleString()} out` +
    ` = ~$${costUsd.toFixed(4)} (est. at $${pricing.inputPerM}/$${pricing.outputPerM} per 1M)`
  );
}

export function printCostSummary() {
  if (_costAccumulator.totalUsd === 0) return;
  console.log(
    `\n  💰 Total Gemini cost: $${_costAccumulator.totalUsd.toFixed(4)}` +
    ` (${_costAccumulator.inputTokens.toLocaleString()} in + ${_costAccumulator.outputTokens.toLocaleString()} out tokens)`
  );
  console.log(`     Verify pricing at https://ai.google.dev/pricing`);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function run(cmd, { silent = false, env } = {}) {
  if (!silent) console.log(`  $ ${cmd.slice(0, 140)}`);
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: silent ? 'pipe' : 'inherit',
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
}

// Retries a Gemini generateContent call up to 3 times with exponential backoff
// on transient errors (503/429/500/504/network). Throws the last error otherwise.
//
// Pass { stream: true } for long outputs (e.g. full transcripts): streaming
// returns response headers immediately and keeps the connection alive while the
// model generates, avoiding undici's ~5-minute headers timeout that surfaces as
// a bare "fetch failed". Returns a { response } object in both modes so callers
// can uniformly use result.response.text() / result.response.usageMetadata.
async function generateWithRetry(model, payload, label = 'Gemini call', { stream = false } = {}) {
  const MAX_ATTEMPTS = 3;
  const TRANSIENT = /\b(429|500|502|503|504)\b|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed|high demand|terminated/i;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (stream) {
        const { stream: chunks, response } = await model.generateContentStream(payload);
        for await (const _ of chunks) process.stdout.write('.'); // drain to keep connection alive
        process.stdout.write('\n');
        return { response: await response };
      }
      return await model.generateContent(payload);
    } catch (err) {
      lastErr = err;
      const msg = err?.message || String(err);
      if (attempt === MAX_ATTEMPTS || !TRANSIENT.test(msg)) throw err;
      const delayMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s
      console.warn(`  ⚠ ${label} failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg.slice(0, 200)}`);
      console.warn(`     Retrying in ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function getAudioDuration(file) {
  return parseFloat(
    runCapture(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
    ).trim()
  );
}

// Loads episode notes from either a Google Docs URL (public export) or a
// local file (preferred for private docs — download via File → Download →
// Markdown in Google Docs). Returns the raw text, or '' on failure.
async function loadNotes(notesArg) {
  if (!notesArg) return '';

  const gdocMatch = notesArg.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (gdocMatch) {
    const docId = gdocMatch[1];
    console.log(`  Fetching Google Doc notes (${docId})...`);
    try {
      const r = await fetch(`https://docs.google.com/document/d/${docId}/export?format=md`, { redirect: 'follow' });
      if (r.ok) {
        const text = await r.text();
        if (text && !text.trim().startsWith('<!DOCTYPE') && !text.trimStart().startsWith('<html')) {
          console.log(`  ✓ Notes loaded (${text.length.toLocaleString()} chars)`);
          return text;
        }
      }
    } catch {}
    console.warn(
      '  ⚠ Google Doc is not publicly shared. Either share it as "Anyone with the link → Viewer",\n' +
      '     or download it (File → Download → Markdown) and pass the local path via --notes.\n' +
      '     Skipping notes.'
    );
    return '';
  }

  if (existsSync(notesArg)) {
    let text;
    if (/\.(docx?|rtf)$/i.test(notesArg)) {
      // Word file: macOS textutil converts it to HTML; keep the links as Markdown links.
      const html = runCapture(`textutil -convert html -stdout "${notesArg}"`).replace(/<head>[\s\S]*?<\/head>/, '');
      text = html
        .replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, url, label) => `[${label.replace(/<[^>]+>/g, '')}](${url})`)
        .replace(/<li[^>]*>/g, '* ').replace(/<\/(p|li|h\d|div)>/g, '\n').replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n+/g, '\n').trim();
    } else {
      text = readFileSync(notesArg, 'utf8');
    }
    console.log(`  ✓ Notes loaded from ${notesArg} (${text.length.toLocaleString()} chars)`);
    return text;
  }

  console.warn(`  ⚠ --notes value is neither a Google Docs URL nor an existing file: ${notesArg}`);
  return '';
}

async function promptCoverImage() {
  if (!process.stdin.isTTY) return null;  // no terminal: no question
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

// Voice processing. GarageBand track effects are not in the raw WAV files, so the script applies its own chain.
const VOICE = {
  TRACK_LUFS:  -23,     // each track gets a fixed gain to this speech loudness before the chain
  TARGET_LUFS: -16,     // loudness of the finished speech (Apple and Spotify target)
  PEAK:        0.84,    // -1.5 dBFS limiter ceiling
  HIGHPASS:    100,     // Hz — removes rumble and plosive energy
  // Downward expander. Speech of the track owner is at about -22 dB RMS after the gain; speech of the other
  // persons in the room is 15 dB or more below that. The gate decreases this bleed, which causes a hollow sound.
  GATE: 'agate=threshold=0.03:ratio=3:range=0.125:attack=10:release=300:detection=rms',
  // Fitted to the GarageBand export of episode 522 (Ran's presets): warmth at 250 Hz, presence, air.
  EQ: 'equalizer=f=250:t=q:w=1:g=2.5,equalizer=f=4000:t=q:w=0.8:g=1.5,highshelf=f=7000:g=3',
  COMPRESSOR: 'acompressor=threshold=0.125:ratio=2:attack=15:release=250:knee=6',
  DEESSER: 'deesser=i=0.4',
  // Rebuilds peaks that the recorder cut off. Used only for a track that clips. Ran selected it from samples (2026-11-24).
  DECLIP: 'adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add',
  // The GarageBand patches have fixed compressor thresholds, so their effect depends on the recording level.
  // Each track gets a fixed gain to this loudness before its patch. -24 LUFS is the level of the recordings
  // (episodes 522 and 523) on which Ran selected the sound.
  PATCH_INPUT_LUFS: -24,
  MAX_INPUT_GAIN: 18,   // dB — limit of that gain
  MAX_TRIM: 6,          // dB — limit of the speaker balance correction
  MAX_LRA: 8,           // a pre-mixed input with a larger loudness range gets a slow leveler
  LEVELER: 'dynaudnorm=f=500:g=31:m=6:p=0.7',
};

// ─── GarageBand patches ──────────────────────────────────────────────────────
// A .patch folder (GarageBand: Library → Save) holds the Channel EQ, Compressor and DeEsser settings of a track.
// The values were checked against a GarageBand export of episode 522: the spectrum agrees within about 1 dB.
// Not reproduced: the two reverb sends and the exact DeEsser values.

// Reads the plug-in settings from a GarageBand .patch (Logic channel strip) and returns ffmpeg filter-graph text.
export function readPatch(dir) {
  const d = readFileSync(join(dir, '#Root.cst'));
  const plugins = [];
  let i = -1;
  while ((i = d.indexOf('GAMETSPP', i + 1)) !== -1) {
    // The first field is the size of the parameter block; each plug-in type has its own size.
    const type = { 0xec: 'Channel EQ', 0x9a: 'Compressor', 0xa0: 'DeEsser' }[d.readUInt32LE(i + 8)];
    if (!type) continue;
    const p = Array.from({ length: 40 }, (_, k) => d.readFloatLE(i + 16 + 4 * k));
    plugins.push({ type, p });
  }
  return plugins;
}
const dbToLinear = (x) => Math.pow(10, x / 20);
const round4 = (x) => +x.toFixed(4);
function patchEq(p) {
  const f = [];
  const band = (k) => ({ on: p[4 * k] === 1, freq: p[4 * k + 1], gain: p[4 * k + 2], q: p[4 * k + 3] });
  const hp = band(0); if (hp.on) f.push(`highpass=f=${round4(hp.freq)}:t=q:w=${round4(hp.q)}`, `highpass=f=${round4(hp.freq * 0.8)}:t=q:w=0.71`);
  const ls = band(1); if (ls.on && ls.gain) f.push(`lowshelf=f=${round4(ls.freq)}:g=${round4(ls.gain)}:t=q:w=${round4(Math.min(ls.q, 1))}`);
  for (let k = 2; k <= 5; k++) { const b = band(k); if (b.on && b.gain) f.push(`equalizer=f=${round4(b.freq)}:t=q:w=${round4(b.q)}:g=${round4(b.gain)}`); }
  const hs = band(6); if (hs.on && hs.gain) f.push(`highshelf=f=${round4(hs.freq)}:g=${round4(hs.gain)}:t=q:w=${round4(Math.min(hs.q, 1))}`);
  const lp = band(7); if (lp.on) f.push(`lowpass=f=${round4(lp.freq)}`);
  return f;
}
// Returns graph statements that take [in] to [out]; labels get the prefix.
export function patchGraph(plugins, inLabel, outLabel, prefix, { deesser = true } = {}) {
  const order = [];
  const eqs = plugins.filter(x => x.type === 'Channel EQ'), comps = plugins.filter(x => x.type === 'Compressor');
  if (eqs[0]) order.push(eqs[0]); if (comps[0]) order.push(comps[0]);
  if (deesser && plugins.some(x => x.type === 'DeEsser')) order.push({ type: 'DeEsser' });
  if (eqs[1]) order.push(eqs[1]); if (comps[1]) order.push(comps[1]); if (eqs[2]) order.push(eqs[2]);
  const stmts = []; let cur = inLabel, chain = [], n = 0;
  const flushChain = (to) => { stmts.push(`[${cur}]${chain.length ? chain.join(',') : 'anull'}[${to}]`); cur = to; chain = []; };
  for (const pl of order) {
    if (pl.type === 'Channel EQ') chain.push(...patchEq(pl.p));
    else if (pl.type === 'DeEsser') chain.push('deesser=i=0.3');
    else {
      const [thr, ratio, attack, release, gain] = pl.p; const mix = pl.p[24] / 100;
      const comp = `acompressor=threshold=${round4(Math.max(dbToLinear(thr), 0.001))}:ratio=${round4(Math.min(ratio, 20))}:attack=${round4(attack)}:release=${round4(release)}:knee=2${gain > 0 ? `:makeup=${round4(dbToLinear(gain))}` : ''}` + (gain < 0 ? `,volume=${round4(gain)}dB` : '');
      if (mix >= 0.999) chain.push(comp);
      else {
        const a = `${prefix}s${n++}`; flushChain(a);
        stmts.push(`[${a}]asplit[${a}d][${a}w]`, `[${a}w]${comp}[${a}c]`, `[${a}d][${a}c]amix=inputs=2:weights='${round4(1 - mix)} ${round4(mix)}':normalize=0[${a}m]`);
        cur = `${a}m`;
      }
    }
  }
  flushChain(outLabel);
  return stmts;
}

// EBU R128 measurement of a file (optionally after a filter chain).
export function measureLoudness(file, pre = '') {
  const out = runCapture(`ffmpeg -hide_banner -nostats -i "${file}" -af "${pre ? pre + ',' : ''}ebur128=peak=true:framelog=verbose" -f null - 2>&1`);
  const summary = out.slice(out.lastIndexOf('Summary:'));
  const num = (re) => { const m = summary.match(re); return m ? parseFloat(m[1]) : NaN; };
  return { i: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), peak: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

// RMS level (dB) of each half-second frame of one stream. graph = filter statements that make the label.
function frameLevels(inputArgs, label, graph = []) {
  const stmts = [...graph, `${label}asetnsamples=22050,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-[m]`];
  const out = execSync(`ffmpeg -hide_banner -nostats -v error ${inputArgs} -filter_complex "${stmts.join('; ')}" -map "[m]" -f null -`, { encoding: 'utf8', stdio: 'pipe', maxBuffer: 256 * 1024 * 1024 });
  return [...out.matchAll(/RMS_level=(\S+)/g)].map(m => (m[1] === '-inf' ? -120 : Math.max(-120, parseFloat(m[1]))));
}

export function voiceChain(gainDb) {
  return [`highpass=f=${VOICE.HIGHPASS}`, `volume=${gainDb.toFixed(2)}dB`, VOICE.GATE, VOICE.EQ, VOICE.COMPRESSOR, VOICE.DEESSER].join(',');
}

// A limiter that works on the true peak: it runs at 4x the sample rate, so peaks between samples are limited too.
// The Apple limit is -1 dBFS true peak; the MP3 encode adds about 0.5 dB.
function truePeakLimiter(limit) {
  return `aresample=176400,alimiter=limit=${limit}:level=false,aresample=44100`;
}

// Writes the speech at TARGET_LUFS with a limiter. A fixed gain: no pumping, pauses stay quiet.
function levelSpeech(input, output, pre = '') {
  const before = measureLoudness(input, pre);
  let gain = VOICE.TARGET_LUFS - before.i;
  const render = () => run(`ffmpeg -y -v error -i "${input}" -ac 1 -af "${pre ? pre + ',' : ''}volume=${gain.toFixed(2)}dB,${truePeakLimiter(VOICE.PEAK)}" "${output}"`, { silent: true });
  render();
  let after = measureLoudness(output);
  // The limiter removes a little loudness. Correct one time.
  if (Math.abs(after.i - VOICE.TARGET_LUFS) > 0.4) {
    gain += VOICE.TARGET_LUFS - after.i;
    render();
    after = measureLoudness(output);
  }
  console.log(`  Loudness: ${before.i} → ${after.i} LUFS (range ${after.lra} LU, peak ${after.peak} dBFS)`);
  return after;
}

function mixWavTracks(bandDir, output, patchesDir) {
  console.log('\n▶ Step 0: Processing and mixing WAV tracks from GarageBand project');

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
  const defaultPatch = join(patchesDir || '', 'default.patch');
  // voices.json: changes that are added to the patch of a speaker (a lower low cut, filters after the patch).
  let voices = {};
  try { voices = JSON.parse(readFileSync(join(patchesDir || '', 'voices.json'), 'utf8')); } catch {}
  const chains = wavFiles.flatMap((f, i) => {
    const { i: lufs, peak } = measureLoudness(f);
    const clips = peak >= -0.1;
    const clipNote = clips ? '  ⚠ the recording clips (peaks repaired), decrease the input gain' : '';
    const declip = (stmts) => { if (clips) stmts[0] = stmts[0].replace(`[${i}:a]`, `[${i}:a]${VOICE.DECLIP},`); return stmts; };
    const inputGain = Number.isFinite(lufs) ? Math.max(-VOICE.MAX_INPUT_GAIN, Math.min(VOICE.MAX_INPUT_GAIN, VOICE.PATCH_INPUT_LUFS - lufs)) : 0;
    // Gain to the reference level, after the peak repair and before the patch.
    const patchInput = (stmts) => { declip(stmts); stmts[0] = stmts[0].replace(/^(\[\d+:a\](?:adeclip[^,]*,)?)/, `$1volume=${inputGain.toFixed(2)}dB,`); return stmts; };
    // "Ran#01.wav" → speaker "Ran" → assets/patches/Ran.patch, or default.patch for a guest.
    const speaker = basename(f).replace(/[#.].*$/, '');
    const own = join(patchesDir || '', `${speaker}.patch`);
    const patch = patchesDir && existsSync(own) ? own : patchesDir && existsSync(defaultPatch) ? defaultPatch : null;
    if (patch) {
      const voice = existsSync(own) ? voices[speaker] : null; // only for the speaker's own patch, not for the guest patch
      console.log(`    - ${basename(f)}: ${lufs} LUFS, gain ${inputGain >= 0 ? '+' : ''}${inputGain.toFixed(1)} dB, patch ${basename(patch)}${voice ? ' + voices.json' : ''}${clipNote}`);
      if (!voice) return patchInput(patchGraph(readPatch(patch), `${i}:a`, `t${i}`, `p${i}`));
      const stmts = patchInput(patchGraph(readPatch(patch), `${i}:a`, `q${i}`, `p${i}`));
      if (voice.highpass) {
        // The patch low cut is two filters (f and 0.8 f). Both move to the new frequency.
        let k = 0;
        stmts[0] = stmts[0].replace(/highpass=f=[\d.]+/g, () => `highpass=f=${k++ === 0 ? voice.highpass : Math.round(voice.highpass * 0.8)}`);
      }
      return [...stmts, `[q${i}]${voice.post || 'anull'}[t${i}]`];
    }
    // No patch: generic chain. Fixed gain to the same speech loudness, then gate, EQ, compressor, de-esser.
    const gain = VOICE.TRACK_LUFS - lufs;
    console.log(`    - ${basename(f)}: ${lufs} LUFS, generic chain, gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB${clipNote}`);
    return declip([`[${i}:a]${voiceChain(gain)}[t${i}]`]);
  });
  const inputs = wavFiles.map(f => `-i "${f}"`).join(' ');
  const n = wavFiles.length;

  // Speaker balance. The patches do not make the speakers equally loud (a compressor depends on the input level).
  // Measure the speech loudness of each processed track and trim each track to the mean.
  // The level of a speaker = the mean level of the processed track in the half-second frames where the raw track
  // of that speaker is clearly the loudest. (The loudness of the full track is wrong for a speaker who talks little:
  // it then measures the other voices that the microphone hears.)
  const rawLevels = wavFiles.map(f => frameLevels(`-i "${f}"`, '[0:a]'));
  const processedLevels = wavFiles.map((f, i) => {
    const own = chains.filter(c => c.startsWith(`[${i}:a]`) || c.startsWith(`[p${i}s`) || c.startsWith(`[q${i}]`)).map(c => c.replaceAll(`[${i}:a]`, '[0:a]').replace(`${VOICE.DECLIP},`, '')); // no peak repair here: it is slow and does not change the level
    return frameLevels(`-i "${f}"`, `[t${i}]`, own);
  });
  const frames = Math.min(...rawLevels.map(l => l.length), ...processedLevels.map(l => l.length));
  const sum = wavFiles.map(() => 0), count = wavFiles.map(() => 0);
  for (let k = 0; k < frames; k++) {
    const lv = rawLevels.map(l => l[k]);
    const top = lv.indexOf(Math.max(...lv));
    const second = Math.max(...lv.filter((_, i) => i !== top), -200);
    if (lv[top] > -32 && lv[top] - second > 8) { sum[top] += processedLevels[top][k]; count[top]++; }
  }
  // A speaker with less than 20 s of clear speech gets no correction.
  const processed = sum.map((x, i) => count[i] >= 40 ? x / count[i] : NaN);
  const valid = processed.filter(Number.isFinite);
  const mean = valid.reduce((a, b) => a + b, 0) / (valid.length || 1);
  const trims = processed.map(x => Number.isFinite(x) ? Math.max(-VOICE.MAX_TRIM, Math.min(VOICE.MAX_TRIM, mean - x)) : 0);
  console.log(`  Speaker balance: ${wavFiles.map((f, i) => `${basename(f).replace(/[#.].*$/, '')} ${trims[i] >= 0 ? '+' : ''}${trims[i].toFixed(1)} dB`).join(', ')}`);
  trims.forEach((t, i) => chains.push(`[t${i}]volume=${t.toFixed(2)}dB[b${i}]`));

  const filter = `${chains.join('; ')}; ${wavFiles.map((_, i) => `[b${i}]`).join('')}amix=inputs=${n}:duration=longest:normalize=0[out]`;

  // FLAC: no quality loss before the final MP3.
  run(`ffmpeg -y -v error ${inputs} -filter_complex "${filter}" -map "[out]" "${output}"`);
  console.log(`  ✓ Mixed to ${output}`);
  return output;
}

// ─── Step 1: Audio processing (ducked intro/outro beds + normalize) ──────────
//
// Design:
//   INTRO BED  — music starts simultaneously with speech at low volume (-18 dB),
//                fades in over 3 s, holds for 20 s, then fades out over 8 s.
//                Listener hears voice immediately with subtle music underneath.
//
//   OUTRO BED  — a single stream with a piecewise volume envelope applied via
//                volume=eval=frame, then delayed so it ends POST_ROLL seconds
//                after speech. Sits quietly under speech (PRE_VOL), swells across
//                a short crossfade region as speech winds down, holds at POST_VOL
//                after speech ends, then fades to silence.
//   Result: a smooth musical swell that lifts from under the speech, peaks just
//           after the last word, then fades away naturally.
//
//   The outro deliberately uses a single stream (rather than asplit + two delayed
//   branches with afade crossfade) — asplit feeding two long-delay consumers at
//   different read rates was occasionally producing truncated output where amix
//   stopped at the second branch's delay boundary.

// Piecewise-linear volume expression for the ffmpeg volume filter. points = [[seconds, volume], ...] in time order.
// Before the first point the volume is the first value; after the last point it is the last value.
export function envelopeExpr(points) {
  let expr = String(points[points.length - 1][1]);
  for (let i = points.length - 1; i >= 1; i--) {
    const [t0, v0] = points[i - 1];
    const [t1, v1] = points[i];
    const seg = t1 > t0 ? `${v0}+(${v1 - v0})*(t-${t0})/${t1 - t0}` : String(v1);
    expr = `if(lt(t,${t1}),${seg},${expr})`;
  }
  return `if(lt(t,${points[0][0]}),${points[0][1]},${expr})`;
}

// Timeline of the opening when there is a recorded welcome line (all times in seconds of the episode):
// music sting → welcome voice over ducked music → short music rise → the hosts start while the music ducks to a bed.
export function welcomeTimeline(welcomeDur) {
  const HIT = 0.60, UNDER_VOICE = 0.14, RISE = 0.70, BED = 0.06; // the music file is approximately -15 dB RMS
  const voiceStart = 0.9;
  const voiceEnd = voiceStart + welcomeDur;
  const hostsStart = voiceEnd + 0.8;
  const points = [
    [0, 0], [0.15, HIT], [voiceStart - 0.35, HIT], [voiceStart, UNDER_VOICE],
    [voiceEnd - 0.15, UNDER_VOICE], [voiceEnd + 0.3, RISE],   // rise as the voice ends
    [hostsStart - 0.3, RISE], [hostsStart + 1.3, BED],        // the duck starts before the first word of the hosts
    [hostsStart + 7, BED], [hostsStart + 17, 0],
  ].map(([t, v]) => [Number(t.toFixed(3)), v]);
  return { voiceStart, hostsStart: Number(hostsStart.toFixed(3)), points, end: points[points.length - 1][0] };
}

// Timeline of the end when there is a recorded sign-off line. Times are on the clock of the outro music file.
// music bed under the goodbyes → sign-off voice over ducked music → music rise → fade out.
export function signoffTimeline(signoffDur, outroDur) {
  const BED = 0.10, UNDER_VOICE = 0.14, RISE = 0.316;
  const GAP = 1.0, TAIL = 6, FADE_IN = 5;
  const speechEnd = Math.max(0, outroDur - GAP - signoffDur - TAIL); // seconds of music before the last word
  const voiceEnd = Math.min(outroDur, speechEnd + GAP + signoffDur);
  const points = [
    [0, 0], [Math.min(FADE_IN, speechEnd), BED], [speechEnd, BED], [speechEnd + GAP, UNDER_VOICE],
    [voiceEnd, UNDER_VOICE], [Math.min(outroDur, voiceEnd + 1.5), RISE], [outroDur, 0],
  ].map(([t, v]) => [Number(t.toFixed(3)), v]);
  return { speechEnd, gap: GAP, points };
}

// Silence at the end of an audio file, in seconds (0 when the file ends with sound).
function trailingSilence(file, dur) {
  const win = Math.min(30, dur);
  const out = run(`ffmpeg -hide_banner -sseof -${win} -i "${file}" -af silencedetect=n=-40dB:d=0.3 -f null - 2>&1 || true`, { silent: true }) || '';
  const starts = [...out.matchAll(/silence_start: ([\d.]+)/g)].map(m => Number(m[1]));
  const ends = [...out.matchAll(/silence_end: ([\d.]+)/g)].map(m => Number(m[1]));
  if (!starts.length) return 0;
  const lastStart = starts[starts.length - 1];
  const open = ends.length < starts.length || ends[ends.length - 1] >= win - 0.05;
  return open ? Math.max(0, win - lastStart) : 0;
}

export function processAudio(opts, inputMp3, outputMp3) {
  // ── Tuning ──────────────────────────────────────────────────────────────────
  const INTRO_PEAK_VOL  = 0.10;   // -20 dB  — brief opening hit
  const INTRO_FADE_IN   = 2;      // s — fade in to peak
  const INTRO_PEAK_DUR  = 2;      // s — hold at peak volume
  const INTRO_DUCK_DUR  = 3;      // s — smooth duck from peak down to bed
  const INTRO_BED_VOL   = 0.040;  // -28 dB  — settled bed under speech
  const INTRO_BED_DUR   = 8;      // s — start fade-out at this point
  const INTRO_FADE_OUT  = 12;     // s — gradual fade out (the music ends 20 s into the episode)

  const OUTRO_PRE_VOL   = 0.100;  // -20 dB  — barely audible under speech
  const OUTRO_POST_VOL  = 0.316;  // -10 dB  — noticeable after speech ends
  const OUTRO_FADE_IN   = 5;      // s — fade in at outro entry
  const OUTRO_POST_ROLL = 10;     // s — outro plays this long after speech ends
  const OUTRO_XFADE     = 2;      // s — crossfade half-width at speech-end boundary
  const OUTRO_FADE_OUT  = 5;      // s — final fade to silence
  // ────────────────────────────────────────────────────────────────────────────

  console.log('\n▶ Step 1: Audio processing (leveling + ducked beds)');

  const hasIntro = existsSync(opts.intro);
  const hasOutro = existsSync(opts.outro);
  if (!hasIntro) console.warn(`  ⚠ Intro not found: ${opts.intro} — skipping`);
  if (!hasOutro) console.warn(`  ⚠ Outro not found: ${opts.outro} — skipping`);

  const speechDur = getAudioDuration(inputMp3);
  const introDur  = hasIntro ? getAudioDuration(opts.intro) : 0;
  const outroDur  = hasOutro ? getAudioDuration(opts.outro) : 0;
  // The welcome line needs the intro music. With a welcome line, the hosts start after it.
  const hasWelcome = hasIntro && opts.welcome && existsSync(opts.welcome);
  const welcome = hasWelcome ? welcomeTimeline(getAudioDuration(opts.welcome)) : null;
  const lead = welcome ? welcome.hostsStart : 0;

  // Level the speech FIRST so the measurement never sees the music-only sections.
  // Music beds are then mixed in at fixed levels on top of the normalized speech.
  const normalizedSpeech = outputMp3 + '.normspeech.flac';
  console.log(`  Leveling speech to ${VOICE.TARGET_LUFS} LUFS (mono)...`);
  let pre = 'silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.1';
  // A pre-mixed file with no compression (for example a raw Riverside download) gets a slow leveler.
  if (measureLoudness(inputMp3).lra > VOICE.MAX_LRA) pre += `,${VOICE.LEVELER}`;
  levelSpeech(inputMp3, normalizedSpeech, pre);

  // Fast path: no music at all
  if (!hasIntro && !hasOutro) {
    run(`ffmpeg -y -v error -i "${normalizedSpeech}" -af ${MP3_SCALE_FIX} ${MP3_ENCODE} "${outputMp3}"`);
    run(`rm -f "${normalizedSpeech}"`, { silent: true });
    return;
  }

  const inputs  = [`-i "${normalizedSpeech}"`];
  const filters = [lead ? `[0:a]adelay=${Math.round(lead * 1000)}:all=1[speech]` : `[0:a]acopy[speech]`];
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
    const trimEnd = Math.min(introDur, (welcome ? welcome.end : t5) + 0.5);

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
      `volume=eval=frame:volume='${welcome ? envelopeExpr(welcome.points) : volExpr}',` +
      `atrim=0:${trimEnd},asetpts=PTS-STARTPTS` +
      `[intro_bed]`
    );
    streams.push('[intro_bed]');
    idx++;
    if (welcome) {
      inputs.push(`-i "${opts.welcome}"`);
      filters.push(`[${idx}:a]aresample=44100,adelay=${Math.round(welcome.voiceStart * 1000)}:all=1[welcome]`);
      streams.push('[welcome]');
      idx++;
      console.log(`  Welcome line: voice at ${welcome.voiceStart}s, hosts start at ${lead}s`);
    }
    console.log(`  Intro: peak ${INTRO_PEAK_DUR}s @ -${Math.round(-20*Math.log10(INTRO_PEAK_VOL))} dB → duck to -${Math.round(-20*Math.log10(INTRO_BED_VOL))} dB bed → fade out at ${t4}s`);
  }

  // ── OUTRO BED ──────────────────────────────────────────────────────────────
  // Single-stream envelope: PRE_VOL (under speech) → linear ramp across XFADE
  // region centered on speech-end → POST_VOL (after speech) → fade to silence.
  // Delayed so it ends POST_ROLL seconds after speech.
  const hasSignoff = hasOutro && opts.signoff && existsSync(opts.signoff);
  if (hasSignoff) {
    // The sign-off line starts a moment after the last word, so the silence at the end of the recording does not count.
    const leveledDur = getAudioDuration(normalizedSpeech);
    const spokenEnd = leveledDur - Math.max(0, trailingSilence(normalizedSpeech, leveledDur) - 0.4);
    const so = signoffTimeline(getAudioDuration(opts.signoff), outroDur);
    const outroDelay = Math.max(0, spokenEnd - so.speechEnd);
    const voiceAt = spokenEnd + so.gap + lead;
    inputs.push(`-i "${opts.outro}"`, `-i "${opts.signoff}"`);
    filters.push(
      `[${idx}:a]volume=eval=frame:volume='${envelopeExpr(so.points)}',atrim=0:${outroDur},asetpts=PTS-STARTPTS,` +
      `adelay=${Math.round((outroDelay + lead) * 1000)}:all=1[outro_bed]`,
      `[${idx + 1}:a]aresample=44100,adelay=${Math.round(voiceAt * 1000)}:all=1[signoff]`
    );
    streams.push('[outro_bed]', '[signoff]');
    idx += 2;
    console.log(`  Outro with sign-off line: music enters ${so.speechEnd.toFixed(1)}s before the last word, voice at ${formatTimestamp(voiceAt)}`);
  } else if (hasOutro) {
    inputs.push(`-i "${opts.outro}"`);

    // Seconds of outro that play *before* speech ends
    const preRoll    = Math.max(0, outroDur - OUTRO_POST_ROLL);
    // Absolute time in the episode when the outro starts
    const outroDelay = Math.max(0, speechDur - preRoll);
    // Time within the outro track at which speech ends (≈ preRoll)
    const seAt       = speechDur - outroDelay;

    // Volume envelope time points (relative to the outro stream's own clock)
    const xfStart      = Math.max(0, seAt - OUTRO_XFADE);          // ramp PRE → POST starts
    const xfEnd        = Math.min(outroDur, seAt + OUTRO_XFADE);   // ramp ends
    const fadeOutStart = Math.max(xfEnd, outroDur - OUTRO_FADE_OUT);
    const fadeInEnd    = Math.min(OUTRO_FADE_IN, xfStart);         // initial fade-in cap
    const delayMs      = Math.round((outroDelay + lead) * 1000);
    const dPostPre     = OUTRO_POST_VOL - OUTRO_PRE_VOL;
    const xfDur        = Math.max(0.001, xfEnd - xfStart);
    const fOutDur      = Math.max(0.001, outroDur - fadeOutStart);

    // Piecewise volume by stream-local t:
    //   [0, fadeInEnd]:           ramp 0 → PRE_VOL
    //   [fadeInEnd, xfStart]:     PRE_VOL
    //   [xfStart, xfEnd]:         ramp PRE_VOL → POST_VOL  (crossfade)
    //   [xfEnd, fadeOutStart]:    POST_VOL
    //   [fadeOutStart, outroDur]: ramp POST_VOL → 0
    const volExpr =
      `if(lt(t,${fadeInEnd}), ${OUTRO_PRE_VOL}*t/${fadeInEnd},` +
      `if(lt(t,${xfStart}), ${OUTRO_PRE_VOL},` +
      `if(lt(t,${xfEnd}), ${OUTRO_PRE_VOL}+${dPostPre}*(t-${xfStart})/${xfDur},` +
      `if(lt(t,${fadeOutStart}), ${OUTRO_POST_VOL},` +
      `if(lt(t,${outroDur}), ${OUTRO_POST_VOL}*(${outroDur}-t)/${fOutDur},` +
      `0)))))`;

    filters.push(
      `[${idx}:a]` +
      `volume=eval=frame:volume='${volExpr}',` +
      `atrim=0:${outroDur},asetpts=PTS-STARTPTS,` +
      `adelay=${delayMs}:all=1` +
      `[outro_bed]`
    );
    streams.push('[outro_bed]');
    idx++;

    const preRollMin = `${Math.floor(outroDelay / 60)}:${String(Math.floor(outroDelay % 60)).padStart(2,'0')}`;
    console.log(`  Outro: enters at ${preRollMin} (${preRoll.toFixed(1)}s before speech ends), swells after, ${OUTRO_POST_ROLL}s post-roll`);
  }

  // ── MIX ────────────────────────────────────────────────────────────────────
  const n = streams.length;
  filters.push(`${streams.join('')}amix=inputs=${n}:duration=longest:normalize=0,${truePeakLimiter(0.79)},${MP3_SCALE_FIX}[out]`);

  run(`ffmpeg -y ${inputs.join(' ')} -filter_complex "${filters.join('; ')}" -map "[out]" ${MP3_ENCODE} "${outputMp3}"`);

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
    console.log('  File not yet published — uploading now...');
    uploadAudio(audioFile, opts.bucket, audioUrl.split('/').pop());
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

const MAX_TRANSCRIPT_DRIFT = 90; // s — the outro music after the last word is about 10 to 35 s

// Seconds between the last transcript timestamp and the end of the audio.
export function transcriptDrift(transcript, audioDur) {
  const stamps = [...transcript.matchAll(/^\[(\d{1,3}(?::\d{2}){1,2})\]/gm)].map(m => m[1].split(':').reduce((acc, p) => acc * 60 + Number(p), 0));
  if (!stamps.length || !Number.isFinite(audioDur)) return Infinity;
  return audioDur - Math.max(...stamps);
}

export async function transcribe(opts, audioFile, transcriptFile) {
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

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `This is a Hebrew-language technology podcast episode called "רברס עם פלטפורמה" (Reversim Podcast), episode ${opts.episode}: "${opts.title}".

Provide a complete, detailed transcript in Hebrew.

Rules:
- Include timestamps at every speaker change and topic shift, in [MM:SS] format
- Identify speakers: the regular hosts are רן (Ran) and אורי (Ori); identify guests from context
- Reproduce all technical terms, product names, and company names exactly as spoken
- Do NOT summarize — provide the complete verbatim transcript

Format each line as:
[MM:SS] **Speaker name**: text`;

  // Gemini timestamps sometimes drift on long audio (the transcript "ends" minutes before the audio).
  // A drifted transcript gives wrong chapter links and wrong cold open cuts, so check it and try again.
  const audioDur = getAudioDuration(audioFile);
  let transcript = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`  Requesting transcription (streaming)${attempt > 1 ? `, attempt ${attempt}` : ''}...`);
    const result = await generateWithRetry(model, [
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: prompt },
    ], 'Transcription', { stream: true });
    transcript = result.response.text();
    reportUsage('Transcription', result.response.usageMetadata, GEMINI_MODEL);
    const drift = transcriptDrift(transcript, audioDur);
    if (Math.abs(drift) <= MAX_TRANSCRIPT_DRIFT) break;
    console.warn(`  ⚠ Transcript timestamps do not match the audio: last line is ${Math.round(drift)} s before the end.`);
    if (attempt === 3) console.warn('  ⚠ Kept the last attempt. Check the timestamps before you publish.');
  }
  writeFileSync(transcriptFile, transcript, 'utf8');
  console.log(`  ✓ Transcript (${transcript.length.toLocaleString()} chars) → ${transcriptFile}`);

  try { await fileManager.deleteFile(uploadResult.file.name); } catch {}

  return transcript;
}

// Ensures opts.coverImage is a path the deployed site can serve. Remote URLs
// and existing /images/ web paths are left as-is; a local filesystem path is
// copied into public/images/ and rewritten to its /images/ web path.
function normalizeCoverImage(opts) {
  const img = opts.coverImage;
  if (!img || img.startsWith('http') || img.startsWith('/images/')) return;

  const src = resolve(img);
  if (!existsSync(src)) {
    console.warn(`  ⚠ cover_image not found locally: ${img} — leaving path as-is`);
    return;
  }
  const ext = (extname(src) || '.png').toLowerCase();
  const filename = `ep${opts.episode}-cover${ext}`;
  const dest = join(REPO_ROOT, 'public/images', filename);
  copyFileSync(src, dest);
  opts.coverImage = `/images/${filename}`;
  console.log(`  Copied cover image → public/images/${filename}`);
}

// ─── Step 2b: Cold open ──────────────────────────────────────────────────────
// A cold open is 20–45 s of the strongest quotes of the episode, played before the intro.
//   1. Gemini reads the transcript and proposes quotes (text + approximate time).
//   2. For each quote, Gemini listens to a 90 s window and gives the exact start and end.
//   3. ffmpeg silencedetect moves each cut to the nearest pause, so no word is cut.
//   4. The clips go before the episode body. All later timestamps move by the same offset.

const COLD_OPEN = {
  MAX_TOTAL: 20,      // s — maximum length of all clips together
  CLIP_MIN: 3,        // s
  CLIP_MAX: 12,       // s
  MAX_CLIPS: 2,
  EXTEND: 5,          // s — maximum move of a cut to the adjacent pause when the check finds a cut-off sentence
  SILENCE_NOISE: '-28dB', // processed speech has a high floor between words, so the pause threshold is high
  SILENCE_MIN: 0.12,  // s — fast speakers make short pauses
  CHECKS: 3,          // attempts to get a clean cut
  GAP: 0.35,          // s — silence between clips
  TAIL_GAP: 0.05,     // s — silence between the last clip and the intro music (short: the music answers the quote)
  FADE: 0.08,         // s — fade at each clip edge
  WINDOW: 90,         // s — audio window sent to Gemini to locate a quote
  WINDOW_LEAD: 25,    // s — window starts this long before the approximate time
  SNAP: 1.5,          // s — maximum move of a cut to reach a pause
  EDGE_GUARD: 120,    // s — no quotes from the first and last 2 minutes (music beds, greetings)
};

export function parseStamp(stamp) {
  const parts = String(stamp).trim().split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => !Number.isFinite(n))) return NaN;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// Moves every "[MM:SS]" at the start of a transcript line by `offset` seconds.
export function shiftTranscript(transcript, offset) {
  const shift = Math.round(offset);
  if (!shift) return transcript;
  return transcript.replace(/^\[(\d{1,3}(?::\d{2}){1,2})\]/gm, (whole, stamp) => {
    const t = parseStamp(stamp);
    if (!Number.isFinite(t)) return whole;
    const s = Math.max(0, t + shift);
    const pad = n => String(n).padStart(2, '0');
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `[${h}:${pad(m)}:${pad(s % 60)}]` : `[${pad(m)}:${pad(s % 60)}]`;
  });
}

// Silent intervals of a window of the file, as [{start, end}] in absolute seconds.
export function detectSilences(file, from, length, noise = '-32dB', minDur = 0.18) {
  let out = '';
  try {
    out = execSync(
      `ffmpeg -hide_banner -nostats -ss ${from} -t ${length} -i "${file}" -af silencedetect=noise=${noise}:d=${minDur} -f null - 2>&1`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
  } catch (e) { out = String(e.stdout || ''); }
  const silences = [];
  let start = null;
  for (const line of out.split('\n')) {
    const a = /silence_start: (-?[\d.]+)/.exec(line);
    const b = /silence_end: (-?[\d.]+)/.exec(line);
    if (a) start = Math.max(0, parseFloat(a[1]));
    if (b && start !== null) { silences.push({ start: from + start, end: from + parseFloat(b[1]) }); start = null; }
  }
  return silences;
}

// Moves a cut point to the nearest pause. A clip starts just before the end of a pause
// and ends just after the start of a pause.
export function snapToSilence(time, silences, edge, maxMove) {
  let best = null;
  for (const s of silences) {
    const target = edge === 'start' ? Math.max(s.start, s.end - 0.2) : Math.min(s.end, s.start + 0.15);
    const move = Math.abs(target - time);
    if (move <= maxMove && (!best || move < best.move)) best = { target, move };
  }
  return best ? best.target : time;
}

// Picks clips in ranked order while the total stays below the limit.
export function pickClips(candidates, maxTotal = COLD_OPEN.MAX_TOTAL, maxClips = COLD_OPEN.MAX_CLIPS) {
  const picked = [];
  let total = 0;
  for (const c of candidates) {
    const dur = c.end - c.start;
    if (picked.length >= maxClips || total + dur > maxTotal) continue;
    if (picked.some(p => c.start < p.end && p.start < c.end)) continue; // overlap
    picked.push(c);
    total += dur;
  }
  return picked;
}

async function proposeColdOpenQuotes(genAI, opts, transcript, bodyDur) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: 'application/json' } });
  const prompt = `This is the transcript of episode ${opts.episode} ("${opts.title}") of the Hebrew tech podcast "רברס עם פלטפורמה".

Select 8 candidate quotes for a "cold open": a short teaser that plays before the intro and makes a software engineer want to hear the full episode.

Rules for each quote:
- One continuous passage by ONE speaker. Prefer the guest. No back-and-forth.
- Short: 4 to 10 seconds of speech (about 10 to 25 Hebrew words). One or two complete sentences.
- It must make sense with no context: a surprising number, a strong opinion, a concrete failure or lesson, a vivid sentence. No greetings, no introductions of people, no "as I said".
- It starts at the start of a sentence and ends at the end of a sentence, where the speaker stops for a moment. Do not stop in the middle of a thought or before the point of the sentence.
- Not from the first 2 minutes and not from the last 2 minutes of the episode.
- The quotes must come from different parts of the episode.
- Copy the words exactly as they are in the transcript.

Order the list from the strongest quote to the weakest.

Return a JSON array. Each element: {"time": "MM:SS of the transcript line that holds the quote", "speaker": "name", "text": "the exact words", "why": "one short sentence in English"}.

TRANSCRIPT:
${transcript}`;
  const result = await generateWithRetry(model, prompt, 'Cold open quotes');
  reportUsage('Cold open quotes', result.response.usageMetadata, GEMINI_MODEL);
  let list;
  try { list = JSON.parse(result.response.text()); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list
    .map(q => ({ approx: parseStamp(q.time), speaker: String(q.speaker || ''), text: String(q.text || '').trim(), why: String(q.why || '') }))
    .filter(q => Number.isFinite(q.approx) && q.text && q.approx >= COLD_OPEN.EDGE_GUARD && q.approx <= bodyDur - COLD_OPEN.EDGE_GUARD);
}

// Finds the exact start and end of a quote. Returns {start, end} in seconds of the body file, or null.
async function locateQuote(genAI, bodyMp3, quote, workdir, index) {
  const from = Math.max(0, quote.approx - COLD_OPEN.WINDOW_LEAD);
  const windowFile = join(workdir, `_coldopen_window_${index}.mp3`);
  run(`ffmpeg -y -v error -ss ${from} -t ${COLD_OPEN.WINDOW} -i "${bodyMp3}" -ac 1 -b:a 64k "${windowFile}"`, { silent: true });
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: 'application/json' } });
  const prompt = `This audio clip is ${COLD_OPEN.WINDOW} seconds from a Hebrew podcast. Find the passage below in the audio.

PASSAGE:
${quote.text}

Return JSON: {"found": true or false, "start": seconds from the start of the clip where the first word of the passage begins, "end": seconds where the last word of the passage ends}. Use one decimal place. If the passage is not fully inside the clip, return {"found": false}.`;
  const result = await generateWithRetry(model, [
    { inlineData: { mimeType: 'audio/mp3', data: readFileSync(windowFile).toString('base64') } },
    { text: prompt },
  ], 'Cold open locate');
  reportUsage('Cold open locate', result.response.usageMetadata, GEMINI_MODEL);
  try { run(`rm -f "${windowFile}"`, { silent: true }); } catch {}
  let pos;
  try { pos = unwrapJson(JSON.parse(result.response.text())); } catch { pos = null; }
  if (pos) { pos.start = Number(pos.start); pos.end = Number(pos.end); }
  if (!pos || !pos.found || !Number.isFinite(pos.start) || !Number.isFinite(pos.end) || pos.end <= pos.start) {
    if (process.env.COLD_OPEN_DEBUG) console.log(`    locate: ${result.response.text().replace(/\s+/g, ' ')}`);
    return null;
  }
  if (process.env.COLD_OPEN_DEBUG) console.log(`    locate: ${JSON.stringify(pos)} (window starts at ${from} s)`);
  const silences = detectSilences(bodyMp3, from, COLD_OPEN.WINDOW, COLD_OPEN.SILENCE_NOISE, COLD_OPEN.SILENCE_MIN);
  const start = snapToSilence(from + pos.start, silences, 'start', COLD_OPEN.SNAP);
  const end = snapToSilence(from + pos.end, silences, 'end', COLD_OPEN.SNAP);
  const clip = await checkCut(genAI, bodyMp3, { start, end }, silences, workdir, index);
  if (!clip) return null;
  const dur = clip.end - clip.start;
  if (dur < COLD_OPEN.CLIP_MIN || dur > COLD_OPEN.CLIP_MAX) return null;
  return clip;
}

// Moves one edge of a clip out to the adjacent pause. Returns the new clip, or null when there is no pause in range.
export function extendToPause(clip, silences, edge, maxMove = COLD_OPEN.EXTEND) {
  if (edge === 'end') {
    const next = silences.filter(s => s.start > clip.end + 0.05 && s.start - clip.end <= maxMove).sort((a, b) => a.start - b.start)[0];
    return next ? { ...clip, end: Math.min(next.end, next.start + 0.15) } : null;
  }
  const prev = silences.filter(s => s.end < clip.start - 0.05 && clip.start - s.end <= maxMove).sort((a, b) => b.end - a.end)[0];
  return prev ? { ...clip, start: Math.max(prev.start, prev.end - 0.2) } : null;
}

// Moves one edge of a clip in to the nearest pause inside the clip. Returns the new clip, or null.
export function trimToPause(clip, silences, edge, maxMove = COLD_OPEN.EXTEND) {
  if (edge === 'end') {
    const prev = silences.filter(s => s.start < clip.end - 0.3 && clip.end - s.start <= maxMove && s.start > clip.start).sort((a, b) => b.start - a.start)[0];
    return prev ? { ...clip, end: Math.min(prev.end, prev.start + 0.15) } : null;
  }
  const next = silences.filter(s => s.end > clip.start + 0.3 && s.end - clip.start <= maxMove && s.end < clip.end).sort((a, b) => a.end - b.end)[0];
  return next ? { ...clip, start: Math.max(next.start, next.end - 0.2) } : null;
}

// The model sometimes puts the JSON object in an array.
function unwrapJson(value) {
  return Array.isArray(value) ? value[0] : value;
}

// Gemini hears the cut clip and says if it starts and ends on a full sentence. A bad edge moves to the adjacent pause.
// Returns the clean clip, or null.
async function checkCut(genAI, bodyMp3, clip, silences, workdir, index) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: 'application/json' } });
  const file = join(workdir, `_coldopen_check_${index}.mp3`);
  try {
    for (let attempt = 0; attempt < COLD_OPEN.CHECKS; attempt++) {
      run(`ffmpeg -y -v error -ss ${clip.start.toFixed(3)} -t ${(clip.end - clip.start).toFixed(3)} -i "${bodyMp3}" -ac 1 -b:a 64k "${file}"`, { silent: true });
      const result = await generateWithRetry(model, [
        { inlineData: { mimeType: 'audio/mp3', data: readFileSync(file).toString('base64') } },
        { text: `This short Hebrew audio clip will play alone as a teaser. Listen to its first and last second with care.
Return JSON: {"text": "the exact words you hear", "starts_clean": true if the clip starts at the start of a sentence and the first word is complete, "ends_clean": true if the clip ends at the end of a sentence or a complete thought and the last word is complete}.
A clip that stops in the middle of a word, in the middle of a sentence, or on a connecting word (such as "ו", "אבל", "ש", "כי", "אז") does not end clean.` },
      ], 'Cold open check');
      reportUsage('Cold open check', result.response.usageMetadata, GEMINI_MODEL);
      let verdict;
      try { verdict = unwrapJson(JSON.parse(result.response.text())); } catch { return null; }
      if (!verdict) return null;
      console.log(`    check ${attempt + 1}: start ${verdict.starts_clean ? 'ok' : 'BAD'}, end ${verdict.ends_clean ? 'ok' : 'BAD'}`);
      if (process.env.COLD_OPEN_DEBUG) console.log(`      ${clip.start.toFixed(1)}–${clip.end.toFixed(1)} s: ${result.response.text().replace(/\s+/g, ' ')}`);
      if (verdict.starts_clean && verdict.ends_clean) return clip;
      let next = clip;
      // A bad edge moves out to the adjacent pause. When there is no pause, or the clip becomes too long, it moves in.
      for (const [edge, clean] of [['end', verdict.ends_clean], ['start', verdict.starts_clean]]) {
        if (clean || !next) continue;
        const out = extendToPause(next, silences, edge);
        next = out && out.end - out.start <= COLD_OPEN.CLIP_MAX ? out : trimToPause(next, silences, edge);
      }
      if (!next || next.end - next.start < COLD_OPEN.CLIP_MIN) return null;
      clip = next;
    }
    return null;
  } finally {
    try { run(`rm -f "${file}"`, { silent: true }); } catch {}
  }
}

// Writes clips (+ the body, when given) to one MP3.
function renderColdOpen(bodyMp3, clips, outFile, withBody) {
  const filters = clips.map((c, i) => {
    const dur = c.end - c.start;
    const pad = i === clips.length - 1 ? COLD_OPEN.TAIL_GAP : COLD_OPEN.GAP;
    return `[0:a]atrim=start=${c.start.toFixed(3)}:end=${c.end.toFixed(3)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:d=${COLD_OPEN.FADE},afade=t=out:st=${(dur - COLD_OPEN.FADE).toFixed(3)}:d=${COLD_OPEN.FADE},` +
      `apad=pad_dur=${pad}[c${i}]`;
  });
  const labels = clips.map((_, i) => `[c${i}]`).join('') + (withBody ? '[0:a]' : '');
  filters.push(`${labels}concat=n=${clips.length + (withBody ? 1 : 0)}:v=0:a=1,${MP3_SCALE_FIX}[out]`);
  run(`ffmpeg -y -v error -i "${bodyMp3}" -filter_complex "${filters.join('; ')}" -map "[out]" ${MP3_ENCODE} "${outFile}"`, { silent: true });
}

async function askLine(question) {
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

// Builds outputMp3 = cold open + body. Returns the offset in seconds (0 when there is no cold open).
async function addColdOpen(opts, bodyMp3, outputMp3, transcript, infoFile) {
  console.log('\n▶ Step 2b: Cold open');
  const noColdOpen = (reason) => {
    console.log(`  ${reason} — the episode starts with the intro`);
    copyFileSync(bodyMp3, outputMp3);
    writeFileSync(infoFile, JSON.stringify({ offset: 0, clips: [] }, null, 2));
    return 0;
  };
  if (opts.coldOpen === 'off') return noColdOpen('Cold open is off');
  // The audio was made again after a cold open was selected: use the same clips, so the published times stay correct.
  try {
    const saved = JSON.parse(readFileSync(infoFile, 'utf8'));
    if (saved.clips?.length) {
      renderColdOpen(bodyMp3, saved.clips, outputMp3, true);
      const offset = getAudioDuration(outputMp3) - getAudioDuration(bodyMp3);
      writeFileSync(infoFile, JSON.stringify({ offset, clips: saved.clips }, null, 2));
      console.log(`  ✓ Cold open: the ${saved.clips.length} saved clips, ${offset.toFixed(1)} s → ${outputMp3}`);
      return offset;
    }
  } catch {}
  if (!transcript) return noColdOpen('No transcript');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return noColdOpen('GEMINI_API_KEY is not set');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const bodyDur = getAudioDuration(bodyMp3);

  console.log('  Asking Gemini for quotes...');
  const quotes = await proposeColdOpenQuotes(genAI, opts, transcript, bodyDur);
  const located = [];
  for (const [i, q] of quotes.entries()) {
    const pos = await locateQuote(genAI, bodyMp3, q, opts.workdir, i);
    if (pos) located.push({ ...q, ...pos });
    else console.log(`  (quote at ${formatTimestamp(q.approx)} not located exactly — dropped)`);
  }
  if (!located.length) return noColdOpen('No usable quotes');

  located.forEach((c, i) => {
    console.log(`\n  ${i + 1}. [${formatTimestamp(c.start)}, ${(c.end - c.start).toFixed(1)} s] ${c.speaker}: ${c.text}`);
    if (c.why) console.log(`     (${c.why})`);
  });

  let clips = pickClips(located);
  const previewFile = join(opts.workdir, `_coldopen_preview_${opts.episode}.mp3`);
  if (opts.coldOpen === 'ask') {
    for (;;) {
      renderColdOpen(bodyMp3, clips, previewFile, false);
      const total = clips.reduce((sum, c) => sum + c.end - c.start, 0);
      console.log(`\n  Selection: ${clips.map(c => located.indexOf(c) + 1).join(', ')} (${total.toFixed(0)} s). Preview: ${previewFile}`);
      const answer = (await askLine('  Use it? [y = yes, n = no cold open, p = play, or numbers in order, e.g. "2 4"]: ')).toLowerCase();
      if (answer === 'y' || answer === '') break;
      if (answer === 'n') return noColdOpen('Cold open rejected');
      if (answer === 'p') { try { run(`afplay "${previewFile}"`, { silent: true }); } catch {} continue; }
      const chosen = answer.split(/[\s,]+/).map(n => located[parseInt(n, 10) - 1]).filter(Boolean);
      if (chosen.length) clips = chosen; else console.log('  Not understood.');
    }
  }

  renderColdOpen(bodyMp3, clips, outputMp3, true);
  const offset = getAudioDuration(outputMp3) - bodyDur;
  writeFileSync(infoFile, JSON.stringify({ offset, clips }, null, 2));
  console.log(`  ✓ Cold open: ${clips.length} clips, ${offset.toFixed(1)} s → ${outputMp3}`);
  return offset;
}

// ─── Step 3: Generate blog post ───────────────────────────────────────────────

// The blog title is in Hebrew ("523: OpenSearch עם דותן מ-AWS"). The slug stays English for the permalink.
// A title that already has Hebrew letters is used as it is; an English title is translated.
async function hebrewTitle(model, opts) {
  if (/[\u0590-\u05FF]/.test(opts.title)) return opts.title;
  // The MP3 tags and the post must have the same title, so the translation is kept in the workdir.
  const cacheFile = join(opts.workdir, `_title_${opts.episode}.json`);
  try {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    if (cached.source === opts.title && cached.title) return cached.title;
  } catch {}
  const prompt = `Translate this podcast episode title to Hebrew for the Hebrew tech podcast "רברס עם פלטפורמה".
Keep names of products, companies and technologies in Latin letters (for example OpenSearch, AWS, Kubernetes).
Write names of persons in Hebrew letters. Common Hebrew phrasing: "X with Dana from Acme" → "X עם דנה מ-Acme" (a well-known Israeli company name can be in Hebrew letters).
Examples: "Company brain with Shmulik from Lusha" → "מוח חברה עם שמוליק מלושה"; "Bumpers 92" → "באמפרס 92"; "Carburetor 42" → "קרבורטור 42".
Output only the Hebrew title on one line, no quotes, no episode number.

Title: ${opts.title}`;
  try {
    const result = await generateWithRetry(model, prompt, 'Hebrew title');
    reportUsage('Hebrew title', result.response.usageMetadata, GEMINI_MODEL);
    const title = result.response.text().trim().split('\n')[0].replace(/^["'״]+|["'״]+$/g, '').replace(/"/g, '״');
    if (/[\u0590-\u05FF]/.test(title)) {
      console.log(`  Hebrew title: ${title}`);
      writeFileSync(cacheFile, JSON.stringify({ source: opts.title, title }));
      return title;
    }
  } catch (err) {
    console.warn(`  ⚠ Hebrew title failed (${err.message || err})`);
  }
  console.warn('  ⚠ No Hebrew title; the post uses the title as given. Edit the title in the post.');
  return opts.title;
}

// The picture for the MP3: the episode cover when there is one, else the show cover.
// The episode cover is made a PNG or JPEG of 1400 px or less. Returns a file path, or null.
function mp3CoverFile(opts) {
  const img = opts.coverImage;
  if (img) {
    const tmp = join(opts.workdir, `_cover_${opts.episode}`);
    try {
      let src = img.startsWith('/images/') ? join(REPO_ROOT, 'public', img) : resolve(img);
      if (/^https?:/.test(img)) {
        src = `${tmp}.download`;
        run(`curl -sfL --max-time 30 -o "${src}" "${img}"`, { silent: true });
      }
      const out = `${tmp}${/\.png$/i.test(img) ? '.png' : '.jpg'}`;
      run(`ffmpeg -y -v error -i "${src}" -vf "scale='min(1400,iw)':-2" -frames:v 1 -update 1 "${out}"`, { silent: true });
      return out;
    } catch {
      console.warn(`  ⚠ The episode cover (${img}) is not usable for the MP3; the show cover is used.`);
    }
  }
  return existsSync(SHOW_COVER) ? SHOW_COVER : null;
}

// Writes ID3 tags and the cover into the final MP3. Players that do not read the feed
// (music players, cars) show these in place of the file name. The audio is not encoded again.
async function tagMp3(file, opts) {
  let title = opts.title;
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: GEMINI_MODEL });
    title = await hebrewTitle(model, opts);
  }
  const quote = v => `"${String(v).replace(/(["\\$`])/g, '\\$1')}"`;
  const tags = {
    title: `${opts.episode}: ${title}`,
    artist: SHOW_NAME,
    album: SHOW_NAME,
    album_artist: SHOW_NAME,
    track: opts.episode,
    date: opts.date.slice(0, 4),
    genre: 'Podcast',
    comment: 'https://www.reversim.com',
  };
  const meta = Object.entries(tags).map(([k, v]) => `-metadata ${k}=${quote(v)}`).join(' ');
  const coverFile = mp3CoverFile(opts);
  const cover = Boolean(coverFile);
  const tmp = `${file}.tagged.mp3`;
  run(`ffmpeg -y -v error -i "${file}" ${cover ? `-i "${coverFile}" -map 0:a -map 1:v -c:v copy -disposition:v attached_pic -metadata:s:v title="Cover" -metadata:s:v comment="Cover (front)"` : '-map 0:a'} ` +
    `-c:a copy -map_metadata -1 -id3v2_version 3 ${meta} "${tmp}"`, { silent: true });
  renameSync(tmp, file);
  console.log(`  ✓ ID3 tags${cover ? ` and cover (${coverFile === SHOW_COVER ? 'show' : 'episode'})` : ''}: ${tags.title}`);
}

async function generatePost(opts, transcript, audioUrl) {
  console.log('\n▶ Step 3: Generating Hebrew blog post');
  normalizeCoverImage(opts);

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
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const tagsHint = opts.tags.length ? `\nTags: ${opts.tags.join(', ')}` : '';

  const notes = await loadNotes(opts.notes);
  const notesSection = notes
    ? `\nEPISODE NOTES (from the host's prep doc — authoritative source for links and context):\n${notes}\n\n` +
      `CRITICAL: Every URL/link present in the EPISODE NOTES MUST appear in the final blog post, ` +
      `placed at the moment in the conversation where the corresponding topic is discussed (per the TRANSCRIPT timestamps). ` +
      `Do not drop any link. Do not move links to a separate "links" section — embed them inline in the bullet ` +
      `that discusses that topic. Use the exact URLs from the notes; do not modify or shorten them. ` +
      `If a link in the notes has no clear matching topic in the transcript, place it in the closest related section.\n`
    : '';

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
- Output only the Markdown body — NO frontmatter YAML${notesSection}

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
  const result = await generateWithRetry(model, prompt, 'Blog post');
  const body = result.response.text();
  reportUsage('Blog post', result.response.usageMetadata, GEMINI_MODEL);

  // Build frontmatter
  const postTitle = await hebrewTitle(model, opts);
  const [year, month] = opts.date.split('-');
  const tagsYaml = opts.tags.length
    ? '\ntags:\n' + opts.tags.map(t => `  - ${t}`).join('\n')
    : '';

  const coverImage = opts.coverImage ? `\ncover_image: ${opts.coverImage}` : '\n# cover_image: /images/TODO.png';

  const frontmatter =
    `---\n` +
    `title: "${opts.episode}: ${postTitle}"\n` +
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

// Saves what the site needs next to the post: the transcript (episode page, VTT in the feed)
// and the size and duration of the MP3 (feed enclosure length and itunes:duration).
function publishEpisodeData(opts, transcript, outputMp3, audioUrl) {
  const [year, month] = opts.date.split('-');
  const postId = `${year}-${month}-${opts.episode}-${opts.slug}`.toLowerCase();
  const dir = join(REPO_ROOT, 'transcripts');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${postId}.md`), transcript.trim() + '\n', 'utf8');
  console.log(`  ✓ Transcript → transcripts/${postId}.md`);
  if (existsSync(outputMp3)) {
    const meta = loadMeta();
    meta[audioUrl] = { bytes: statSync(outputMp3).size, seconds: Math.round(getAudioDuration(outputMp3)) };
    saveMeta(meta);
    console.log(`  ✓ Audio size and duration → src/data/audio-meta.json`);
  }
}

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

  // Style guide + Ran's real past posts (social-posts/*.md) as few-shot examples.
  // Append new posts to those files to keep the voice up to date.
  let systemPrompt = readFileSync(join(__dirname, 'SOCIAL.md'), 'utf8');
  const examplesDir = join(REPO_ROOT, 'social-posts');
  const exampleSections = ['twitter', 'linkedin', 'facebook']
    .map(name => join(examplesDir, `${name}.md`))
    .filter(existsSync)
    .map(file => readFileSync(file, 'utf8').trim());
  if (exampleSections.length) {
    systemPrompt +=
      '\n\n# REAL POSTS (written by Ran — match this voice and structure)\n\n' +
      exampleSections.join('\n\n====================\n\n');
  } else {
    console.warn(`  ⚠ No example posts found in ${examplesDir}`);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const prompt =
    `Blog post URL: ${postUrl}\n\n` +
    `Blog post content (use this since the site may not be deployed yet):\n\n${postContent}`;

  console.log('  Calling Gemini to write social posts...');
  const result = await generateWithRetry(model, prompt, 'Social posts');
  const social = result.response.text();
  reportUsage('Social posts', result.response.usageMetadata, GEMINI_MODEL);

  writeFileSync(socialFile, social, 'utf8');
  console.log(`  ✓ Social posts → ${socialFile}`);
  return social;
}

// ─── Step 4: Upload (S3 + R2) ─────────────────────────────────────────────────
// Episodes are stored in two buckets: Cloudflare R2 (what m2.reversim.com serves)
// and Amazon S3 (kept as a durable backup origin). See docs/media-hosting-migration.md.

function uploadToS3(localFile, bucket, s3Key) {
  const s3Uri = `s3://${bucket}/${s3Key}`;
  run(`aws s3 cp "${localFile}" "${s3Uri}" --profile reversim`);
  console.log(`  ✓ S3:  ${s3Uri}`);
}

function uploadToR2(localFile, bucket, s3Key) {
  const accountId       = process.env.R2_ACCOUNT_ID;
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('  ✗ R2 credentials missing — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env');
    console.error('    m2.reversim.com serves from R2, so the episode would not be live without this.');
    process.exit(1);
  }
  const s3Uri    = `s3://${bucket}/${s3Key}`;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  // Credentials passed via env (not the command line) so they are not logged.
  // when_required avoids the aws-cli v2 default checksum headers that R2 rejects.
  run(`aws s3 cp "${localFile}" "${s3Uri}" --endpoint-url "${endpoint}"`, {
    env: {
      AWS_ACCESS_KEY_ID: accessKeyId,
      AWS_SECRET_ACCESS_KEY: secretAccessKey,
      AWS_DEFAULT_REGION: 'auto',
      AWS_REQUEST_CHECKSUM_CALCULATION: 'when_required',
      AWS_RESPONSE_CHECKSUM_VALIDATION: 'when_required',
    },
  });
  console.log(`  ✓ R2:  ${s3Uri}`);
}

function uploadAudio(localFile, bucket, s3Key) {
  console.log('\n▶ Step 4: Uploading to R2 + S3');
  uploadToR2(localFile, bucket, s3Key);   // primary — m2.reversim.com serves this
  uploadToS3(localFile, bucket, s3Key);   // backup origin
  const audioUrl = `https://m2.reversim.com/${s3Key}`;
  console.log(`  ✓ Live at ${audioUrl}`);
  return audioUrl;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

const QUALITY = {
  LUFS_MIN: -17, LUFS_MAX: -15,    // Apple and Spotify target -16 LUFS
  PEAK_MAX: -1,                    // true peak, dBFS
  MIN_MINUTES: 10, MAX_MINUTES: 150,
};

// Posts in the repository that have this episode number, other than ownPath.
export function postsWithEpisode(episode, ownPath, postsDir = join(REPO_ROOT, 'src/content/posts')) {
  return readdirSync(postsDir)
    .filter(f => f.endsWith('.md') && join(postsDir, f) !== ownPath)
    .filter(f => new RegExp(`^episode:\\s*${episode}\\s*$`, 'm').test(readFileSync(join(postsDir, f), 'utf8').split(/^---\s*$/m)[1] || ''));
}

// The highest episode number in the repository.
function lastEpisode(postsDir = join(REPO_ROOT, 'src/content/posts')) {
  let max = 0;
  for (const f of readdirSync(postsDir)) {
    const m = f.match(/^\d{4}-\d{2}-(\d+)-/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

// Stops the run when the episode number is already used by another post, or is not the next number.
function checkEpisodeNumber(opts, ownPath) {
  const problems = [];
  const others = postsWithEpisode(opts.episode, ownPath);
  if (others.length) problems.push(`episode ${opts.episode} is already in ${others.join(', ')}`);
  const last = lastEpisode();
  if (!existsSync(ownPath) && opts.episode !== last + 1) problems.push(`the last episode is ${last}, so the next number is ${last + 1}, not ${opts.episode}`);
  if (!problems.length) return;
  for (const p of problems) console.error(`  ✗ Episode number: ${p}`);
  if (opts.skipChecks) { console.warn('  ⚠ --skip-checks: continuing'); return; }
  console.error('  Correct --episode, or add --skip-checks if the number is correct.');
  process.exit(1);
}

// Measures the final MP3 and returns the list of problems (empty = good).
export function qualityProblems(file, { expectCover = true } = {}) {
  const problems = [];
  const { i, peak } = measureLoudness(file);
  const minutes = getAudioDuration(file) / 60;
  if (!(i >= QUALITY.LUFS_MIN && i <= QUALITY.LUFS_MAX)) problems.push(`loudness ${i} LUFS (limits ${QUALITY.LUFS_MIN} to ${QUALITY.LUFS_MAX})`);
  if (!(peak <= QUALITY.PEAK_MAX)) problems.push(`true peak ${peak} dBFS (limit ${QUALITY.PEAK_MAX})`);
  if (!(minutes >= QUALITY.MIN_MINUTES && minutes <= QUALITY.MAX_MINUTES)) problems.push(`length ${minutes.toFixed(1)} min (limits ${QUALITY.MIN_MINUTES} to ${QUALITY.MAX_MINUTES})`);
  const probe = JSON.parse(runCapture(`ffprobe -v error -show_entries format_tags=title,artist:stream=codec_type,bit_rate,sample_rate -of json "${file}"`));
  const tags = probe.format?.tags || {};
  if (!tags.title) problems.push('no ID3 title');
  if (!tags.artist) problems.push('no ID3 artist');
  const audio = (probe.streams || []).find(st => st.codec_type === 'audio');
  if (!audio || Number(audio.sample_rate) !== 44100) problems.push(`sample rate ${audio?.sample_rate} (expected 44100)`);
  if (expectCover && !(probe.streams || []).some(st => st.codec_type === 'video')) problems.push('no cover picture');
  console.log(`  Quality: ${i} LUFS, true peak ${peak} dBFS, ${minutes.toFixed(1)} min, title "${tags.title || ''}"`);
  return problems;
}

function qualityGate(file, opts) {
  console.log('\n▶ Quality gate');
  const problems = qualityProblems(file, { expectCover: Boolean(mp3CoverFile(opts)) });
  if (!problems.length) { console.log('  ✓ All checks pass'); return; }
  for (const p of problems) console.error(`  ✗ ${p}`);
  if (opts.skipChecks) { console.warn('  ⚠ --skip-checks: continuing'); return; }
  console.error(`  The upload is stopped. Correct the audio, or add --skip-checks to upload this file.`);
  process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  mkdirSync(opts.workdir, { recursive: true });

  const fileSlug = opts.slug.replace(/-/g, '_');
  const mp3Name   = `reversim${opts.episode}-${fileSlug}.mp3`;
  const mixedMp3  = join(opts.workdir, `_mixed_${opts.episode}.flac`);  // processed voice tracks, lossless
  const bodyMp3   = join(opts.workdir, `_body_${opts.episode}.mp3`);   // intro/outro + normalize, no cold open
  const outputMp3 = join(opts.workdir, mp3Name);                       // final file: cold open + body
  const coldOpenInfo = join(opts.workdir, `_coldopen_${opts.episode}.json`);
  const transcriptFile = join(opts.workdir, `reversim${opts.episode}-${fileSlug}.transcript.md`);
  const audioUrl = `https://m2.reversim.com/${mp3Name}`;

  console.log(`\n🎙  Reversim Podcast — Episode ${opts.episode}: ${opts.title}`);
  console.log(`    Date:  ${opts.date}`);
  console.log(`    MP3:   ${mp3Name}`);
  console.log(`    URL:   ${audioUrl}`);
  if (opts.intro) console.log(`    Intro: ${existsSync(opts.intro) ? '✓' : '✗ not found'} ${opts.intro}`);
  if (opts.outro) console.log(`    Outro: ${existsSync(opts.outro) ? '✓' : '✗ not found'} ${opts.outro}`);
  const [postYear, postMonth] = opts.date.split('-');
  checkEpisodeNumber(opts, join(REPO_ROOT, 'src/content/posts', `${postYear}-${postMonth}-${opts.episode}-${opts.slug}.md`));

  // Determine the raw recording to use
  let rawInput = opts.input;

  // Step 0: Mix WAVs (if --mix-wavs given)
  if (opts.mixWavs) {
    if (!opts.skipMix) {
      if (existsSync(mixedMp3)) {
        console.log(`\n▶ Step 0: Using existing mix (${mixedMp3})`);
      } else {
        mixWavTracks(opts.mixWavs, mixedMp3, opts.patches);
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
    if (existsSync(outputMp3) || existsSync(bodyMp3)) {
      console.log(`\n▶ Step 1: Skipping (output already exists: ${existsSync(outputMp3) ? outputMp3 : bodyMp3})`);
    } else {
      processAudio(opts, rawInput, bodyMp3);
    }
  } else {
    console.log('\n▶ Step 1: Skipped (--skip-audio)');
  }

  // Step 2: Transcribe
  let transcript = '';
  if (!opts.skipTranscribe) {
    if (opts.transcript) {
      if (!existsSync(opts.transcript)) {
        console.error(`\n✗ --transcript file not found: ${opts.transcript}`);
        process.exit(1);
      }
      console.log(`\n▶ Step 2: Using provided transcript (${opts.transcript})`);
      transcript = readFileSync(opts.transcript, 'utf8');
      writeFileSync(transcriptFile, transcript, 'utf8');
    } else if (existsSync(transcriptFile)) {
      console.log(`\n▶ Step 2: Loading existing transcript (${basename(transcriptFile)})`);
      transcript = readFileSync(transcriptFile, 'utf8');
    } else {
      // The transcript is always relative to the body (no cold open). The offset is added later.
      const audioForTranscription = existsSync(bodyMp3) ? bodyMp3 : existsSync(outputMp3) ? outputMp3 : rawInput;
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

  // Step 2b: Cold open. Makes the final MP3 from the body.
  if (!existsSync(outputMp3) && existsSync(bodyMp3)) {
    if (transcript || opts.coldOpen === 'off') {
      await addColdOpen(opts, bodyMp3, outputMp3, transcript, coldOpenInfo);
      await tagMp3(outputMp3, opts);
    } else {
      // A partial run (for example produce-audio) has no transcript yet. Do not make the final MP3 now,
      // or the cold open would be skipped for good.
      console.log('\n▶ Step 2b: Waiting for the transcript (the final MP3 is made after transcription)');
    }
  }
  // All published timestamps (post chapters, transcript) must match the final MP3.
  const coldOpenOffset = existsSync(coldOpenInfo) ? JSON.parse(readFileSync(coldOpenInfo, 'utf8')).offset || 0 : 0;
  if (transcript && coldOpenOffset) transcript = shiftTranscript(transcript, coldOpenOffset);

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
      publishEpisodeData(opts, transcript, outputMp3, audioUrl);
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
    qualityGate(outputMp3, opts);
    uploadAudio(outputMp3, opts.bucket, mp3Name);
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
      const postUrl = `https://www.reversim.com/${year}/${month}/${year}-${month}-${opts.episode}-${opts.slug.toLowerCase()}.html`;
      await generateSocial(opts, postContent, postUrl, socialFile);
    }
  } else {
    console.log('\n▶ Step 5: Skipped (--skip-social)');
  }

  const durationSec = existsSync(outputMp3) ? getAudioDuration(outputMp3) : 0;
  const durationMin = durationSec ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}` : 'unknown';

  printCostSummary();

  console.log('\n✅ Done!');
  console.log(`   Audio URL:  ${audioUrl}`);
  console.log(`   Duration:   ${durationMin}`);
  console.log(`   Transcript: ${transcriptFile}`);
  console.log(`   Social:     ${socialFile}`);
  console.log(`   Workdir:    ${opts.workdir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('\n✗', err.message || err);
    process.exit(1);
  });
}
