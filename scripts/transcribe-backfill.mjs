#!/usr/bin/env node
// Makes transcripts for published episodes that have none, newest first.
// Output: transcripts/<post id>.md (the site shows it on the episode page and as VTT in the feed).
// Run: set -a && . ./.env && set +a && node scripts/transcribe-backfill.mjs --limit 10
//   --limit N        maximum number of episodes in this run (default 5)
//   --parallel N     episodes at the same time (default 3)
//   --dry-run        only list the episodes
// Cost: one Gemini transcription for each episode (approximately $0.5 for a 60-minute episode).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transcribe, transcriptDrift, printCostSummary } from './post-production.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src/content/posts');
const OUT = join(ROOT, 'transcripts');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const limit = Number(arg('--limit', 5));
const parallel = Number(arg('--parallel', 3));
const dryRun = process.argv.includes('--dry-run');

function episodes() {
  const list = [];
  for (const f of readdirSync(POSTS)) {
    if (!f.endsWith('.md')) continue;
    const head = readFileSync(join(POSTS, f), 'utf8').split('\n---')[0];
    const field = (k) => new RegExp(`^${k}:\\s*["']?(.+?)["']?\\s*$`, 'm').exec(head)?.[1];
    const audio = field('audio_url');
    if (!audio || field('draft') === 'true') continue;
    list.push({ id: f.replace(/\.md$/, '').toLowerCase(), audio, title: field('title') ?? f, date: field('date') ?? '', episode: field('episode') ?? '' });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

async function one(ep, workdir) {
  const mp3 = join(workdir, `${ep.id}.mp3`);
  const res = await fetch(ep.audio, { headers: { 'user-agent': 'reversim-transcribe-backfill/1.0 (bot)' } });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  const tmpOut = join(workdir, `${ep.id}.md`);
  const text = await transcribe({ episode: ep.episode, title: ep.title }, mp3, tmpOut);
  const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], { encoding: 'utf8' }).trim());
  rmSync(mp3, { force: true });
  const drift = transcriptDrift(text, seconds);
  if (Math.abs(drift) > 90) throw new Error(`timestamps drift from the audio by ${Math.round(drift)} s — not saved, run again`);
  const lines = text.split('\n').filter((l) => /^\[\d+:\d{2}/.test(l.trim())).length;
  if (lines < 20) throw new Error(`transcript looks wrong (${lines} timestamp lines)`);
  writeFileSync(join(OUT, `${ep.id}.md`), text.trim() + '\n');
  console.log(`✓ ${ep.id} (${lines} lines)`);
}

const todo = episodes().filter((ep) => !existsSync(join(OUT, `${ep.id}.md`))).slice(0, limit);
console.log(`${todo.length} episodes to transcribe:`);
for (const ep of todo) console.log(`  ${ep.id}`);
if (dryRun || !todo.length) process.exit(0);
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY is required'); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const workdir = join(tmpdir(), 'reversim-backfill');
mkdirSync(workdir, { recursive: true });
const queue = [...todo];
let failed = 0;
await Promise.all(Array.from({ length: parallel }, async () => {
  for (let ep = queue.shift(); ep; ep = queue.shift()) {
    try { await one(ep, workdir); } catch (e) { failed++; console.error(`✗ ${ep.id}: ${e.message}`); }
  }
}));
printCostSummary();
console.log(`Done: ${todo.length - failed} transcripts, ${failed} failed`);
process.exit(failed ? 1 : 0);
