#!/usr/bin/env node
// Builds src/data/start-here.json: for each topic, the 6 best episodes for a new listener, plus 6 picks overall.
// Input: src/data/catalog.json (run scripts/catalog.mjs first).
// Run: set -a && . ./.env && set +a && node scripts/start-here.mjs [--popularity streams.json]
//   streams.json is optional: {"<episode number>": <Spotify streams>}. It helps the model prefer episodes that listeners liked.
// One Gemini call for each topic. Run it again a few times a year; the picks are stable in between.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS } from './catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = process.env.START_HERE_MODEL || 'gemini-3.1-pro-preview';
const PICKS = 6;
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('GEMINI_API_KEY is required'); process.exit(1); }
const popArg = process.argv.indexOf('--popularity');
const popularity = popArg > 0 ? JSON.parse(readFileSync(process.argv[popArg + 1], 'utf8')) : {};
const catalog = JSON.parse(readFileSync(join(ROOT, 'src/data/catalog.json'), 'utf8'));

const posts = {};
for (const f of readdirSync(join(ROOT, 'src/content/posts'))) {
  if (!f.endsWith('.md')) continue;
  const head = readFileSync(join(ROOT, 'src/content/posts', f), 'utf8').split('\n---')[0];
  const field = (k) => new RegExp(`^${k}:\\s*["']?(.+?)["']?\\s*$`, 'm').exec(head)?.[1];
  posts[f.replace(/\.md$/, '').toLowerCase()] = { title: field('title') ?? '', year: (field('date') ?? '').slice(0, 4), episode: field('episode') ?? '' };
}

const row = (id) => {
  const c = catalog[id], p = posts[id];
  const streams = popularity[p.episode];
  return `${id} | ${p.year} | ${p.title} | evergreen ${c.evergreen}${streams ? ` | ${streams} Spotify streams` : ''} | ${c.hook}`;
};

async function ask(prompt) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    if (res.ok) return JSON.parse((await res.json()).candidates[0].content.parts.map((p) => p.text ?? '').join(''));
    if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
}

const RULES = `You are the editor of "רברס עם פלטפורמה" (Reversim), a Hebrew podcast for software engineers that has run since 2009.
A new listener asks: "Where do I start?". Select exactly ${PICKS} episodes from the list.
Rules:
- Prefer episodes that are still valuable today: principles, architecture, hard lessons, careers. Old episodes about tools that no one uses now are bad picks. Very old episodes are good only when the idea is timeless.
- Prefer interviews with a clear subject to news round-ups ("Bumpers", "Carburetor"), announcements and conference promotions.
- Give variety: different sub-subjects, different guests, a mix of recent years and classics.
- When Spotify stream counts are given, a high count is a sign of a good episode, but recent episodes have had less time to collect streams.
Return a JSON array of exactly ${PICKS} episode ids (the first column), best first. Use only ids from the list.`;

const ids = Object.keys(catalog).filter((id) => posts[id] && ['interview', 'other'].includes(catalog[id].kind) && catalog[id].hook);
const valid = new Set(ids);
const out = { generated: new Date().toISOString().slice(0, 10), overall: [], topics: {} };

for (const topic of Object.keys(TOPICS)) {
  const list = ids.filter((id) => catalog[id].topics.includes(topic) && catalog[id].evergreen >= 3);
  if (list.length < PICKS) { console.log(`  ${topic}: only ${list.length} episodes — skipped`); continue; }
  const picks = (await ask(`${RULES}\n\nTOPIC: ${TOPICS[topic]}\n\nEPISODES (id | year | title | signals | summary):\n${list.map(row).join('\n')}`)).filter((id) => valid.has(id)).slice(0, PICKS);
  out.topics[topic] = picks;
  console.log(`  ${topic}: ${picks.length} picks from ${list.length}`);
}
const finalists = [...new Set(Object.values(out.topics).flatMap((p) => p.slice(0, 3)))];
out.overall = (await ask(`${RULES}\nThese are the best episodes of each topic. Select the ${PICKS} that show the range and the quality of the show best, from different topics.\n\nEPISODES (id | year | title | signals | summary):\n${finalists.map(row).join('\n')}`)).filter((id) => valid.has(id)).slice(0, PICKS);
writeFileSync(join(ROOT, 'src/data/start-here.json'), JSON.stringify(out, null, '\t') + '\n');
console.log(`Done: ${out.overall.length} overall picks, ${Object.keys(out.topics).length} topics`);
