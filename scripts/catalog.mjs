#!/usr/bin/env node
// Builds src/data/catalog.json: for each episode, the guests, companies, topics and a one-line hook.
// The site uses it for the guest index, the company index and the "start here" page.
// Run: set -a && . ./.env && set +a && node scripts/catalog.mjs          (only new episodes)
//      node scripts/catalog.mjs --all                                     (all episodes again)
// One small Gemini Flash call for each episode.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src/content/posts');
const OUT = join(ROOT, 'src/data/catalog.json');
const MODEL = process.env.CATALOG_MODEL || 'gemini-3.8-flash';

export const TOPICS = {
  'ai': 'AI, LLMs ו-Machine Learning',
  'data': 'Data Engineering ו-Analytics',
  'architecture': 'ארכיטקטורה ו-Backend',
  'infra': 'תשתיות, DevOps ו-Cloud',
  'databases': 'מסדי נתונים ו-Storage',
  'frontend': 'Frontend ו-Mobile',
  'security': 'אבטחת מידע',
  'languages': 'שפות תכנות וכלי פיתוח',
  'quality': 'בדיקות, איכות ו-Observability',
  'management': 'ניהול הנדסה ותרבות ארגונית',
  'career': 'קריירה והתפתחות אישית',
  'product': 'מוצר ו-Startups',
  'opensource': 'קוד פתוח וקהילה',
  'lowlevel': 'חומרה, מערכות הפעלה ו-Low Level',
};

function plain(body) {
  return body
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<a [^>]*href="([^"]*)"[^>]*>/gi, ' [$1] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

function episodes() {
  const list = [];
  for (const f of readdirSync(POSTS)) {
    if (!f.endsWith('.md')) continue;
    const raw = readFileSync(join(POSTS, f), 'utf8');
    const end = raw.indexOf('\n---', 3);
    const head = raw.slice(0, end), body = raw.slice(end + 4);
    const field = (k) => new RegExp(`^${k}:\\s*["']?(.+?)["']?\\s*$`, 'm').exec(head)?.[1];
    if (!field('audio_url') || field('draft') === 'true') continue;
    list.push({ id: f.replace(/\.md$/, '').toLowerCase(), title: field('title') ?? '', date: (field('date') ?? '').slice(0, 10), text: plain(body).slice(0, 7000) });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

const PROMPT = (ep) => `You index episodes of "רברס עם פלטפורמה" (Reversim), a Hebrew podcast for software engineers.
The regular hosts are רן תבורי (Ran Tavory) and אורי להב (Ori Lahav). Recurring co-hosts of the "Bumpers" series are דותן נחום (Dotan Nahum) and אלון נתיב (Alon Nativ). The recurring co-host of the "Carburetor" series is נתי שלום (Nati Shalom). Hosts and co-hosts are NOT guests.

Read the episode page below. Return one JSON object:
{
  "kind": "interview" | "bumpers" | "carburetor" | "summit" | "other",
  "guests": [{"name_he": "full name in Hebrew, as written", "name_en": "full name in English, '' when you cannot know it", "company": "the guest's company at the time, '' when not stated", "role": "short role, '' when not stated"}],
  "companies": ["companies that the episode is mainly about (usually the guest's company); not every company that is mentioned"],
  "topics": ["1 to 3 keys from this list: ${Object.keys(TOPICS).join(', ')}"],
  "hook": "one sentence in Hebrew, maximum 20 words, that tells an engineer what this episode teaches. Facts only, no marketing words.",
  "evergreen": 1 to 5 (5 = still valuable years later: principles, architecture, career; 1 = news of the time or an announcement)
}
Use only facts from the page. Write company names in English when the page gives them in English. Do not invent names. A LinkedIn URL in [brackets] can show the English spelling of a name.

TITLE: ${ep.title}
DATE: ${ep.date}
PAGE:
${ep.text}`;

async function classify(ep, key) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT(ep) }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
    });
    if (res.ok) {
      const j = await res.json();
      const out = JSON.parse(j.candidates[0].content.parts.map((p) => p.text ?? '').join(''));
      const str = (v) => (typeof v === 'string' ? v.trim() : '');
      return {
        kind: str(out.kind) || 'other',
        guests: (Array.isArray(out.guests) ? out.guests : []).map((g) => ({ name_he: str(g.name_he), name_en: str(g.name_en), company: str(g.company), role: str(g.role) })).filter((g) => g.name_he || g.name_en),
        companies: (Array.isArray(out.companies) ? out.companies : []).map(str).filter(Boolean),
        topics: (Array.isArray(out.topics) ? out.topics : []).map(str).filter((t) => t in TOPICS).slice(0, 3),
        hook: str(out.hook),
        evergreen: Math.min(5, Math.max(1, Number(out.evergreen) || 3)),
        usage: j.usageMetadata,
      };
    }
    if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
}

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.error('GEMINI_API_KEY is required'); process.exit(1); }
  const all = process.argv.includes('--all');
  const limitArg = process.argv.indexOf('--limit');
  const catalog = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  let todo = episodes().filter((ep) => all || !catalog[ep.id]);
  if (limitArg > 0) todo = todo.slice(0, Number(process.argv[limitArg + 1]));
  console.log(`${todo.length} episodes to index with ${MODEL}`);
  const save = () => {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.keys(catalog).sort().map((k) => [k, catalog[k]])), null, '\t') + '\n');
  };
  let done = 0, failed = 0, tokensIn = 0, tokensOut = 0;
  const queue = [...todo];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let ep = queue.shift(); ep; ep = queue.shift()) {
      try {
        const { usage, ...entry } = await classify(ep, key);
        catalog[ep.id] = entry;
        tokensIn += usage?.promptTokenCount ?? 0;
        tokensOut += (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
      } catch (e) { failed++; console.warn(`  skip ${ep.id}: ${e.message}`); }
      if (++done % 50 === 0) { console.log(`  ${done}/${todo.length}`); save(); }
    }
  }));
  save();
  console.log(`Done: ${done - failed} indexed, ${failed} failed. Tokens: ${tokensIn.toLocaleString()} in, ${tokensOut.toLocaleString()} out.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
