#!/usr/bin/env node
// Writes mcp/seed.sql: all episodes (show notes, guests, topics) and transcript passages, for the MCP server's D1 database.
// Run: node scripts/mcp-export.mjs, then in mcp/: npm run seed:local (or seed:remote).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.reversim.com';
const PASSAGE_CHARS = 900; // about one minute of speech
const readJson = (p) => (existsSync(join(ROOT, p)) ? JSON.parse(readFileSync(join(ROOT, p), 'utf8')) : {});
const catalog = readJson('src/data/catalog.json');
const audioMeta = readJson('src/data/audio-meta.json');

const q = (v) => (v === null || v === undefined || v === '' ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

function plain(body) {
  return body
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1 ($2)')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

// Groups transcript lines ("[MM:SS] **speaker**: text") into passages of about one minute.
export function toPassages(raw) {
  const passages = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    const m = /^\[(\d{1,3}(?::\d{2}){1,2})\]\s*(?:\*\*(.+?)\*\*\s*:?)?\s*(.*)$/.exec(line.trim());
    if (!m || !m[3]) continue;
    const start = m[1].split(':').reduce((a, p) => a * 60 + Number(p), 0);
    const text = `${m[2] ? m[2].replace(/:$/, '') + ': ' : ''}${m[3].trim()}`;
    if (!cur || cur.text.length + text.length > PASSAGE_CHARS) {
      cur = { start, text };
      passages.push(cur);
    } else cur.text += '\n' + text;
  }
  return passages;
}

function main() {
  const out = [];
  let episodes = 0, withTranscript = 0, passages = 0;
  for (const f of readdirSync(join(ROOT, 'src/content/posts')).sort()) {
    if (!f.endsWith('.md')) continue;
    const raw = readFileSync(join(ROOT, 'src/content/posts', f), 'utf8');
    const end = raw.indexOf('\n---', 3);
    const head = raw.slice(0, end), body = raw.slice(end + 4);
    const field = (k) => new RegExp(`^${k}:\\s*["']?(.+?)["']?\\s*$`, 'm').exec(head)?.[1];
    const audio = field('audio_url');
    if (!audio || field('draft') === 'true') continue;
    const id = f.replace(/\.md$/, '').toLowerCase();
    const date = (field('date') ?? '').slice(0, 10);
    const legacy = field('legacy_path');
    const path = legacy ? (legacy.startsWith('/') ? legacy : `/${legacy}`).replace(/\.html$/, '') : `/${date.slice(0, 4)}/${date.slice(5, 7)}/${id}`;
    const c = catalog[id] ?? {};
    const guests = (c.guests ?? []).map((g) => [g.name_he, g.name_en && g.name_en !== g.name_he ? `(${g.name_en})` : '', g.company ? `— ${[g.role, g.company].filter(Boolean).join(', ')}` : ''].filter(Boolean).join(' ')).join('; ');
    const companies = [...new Set([...(c.guests ?? []).map((g) => g.company), ...(c.companies ?? [])].filter(Boolean))].join(', ');
    const tFile = join(ROOT, 'transcripts', `${id}.md`);
    const ps = existsSync(tFile) ? toPassages(readFileSync(tFile, 'utf8')) : [];
    const notes = plain(body).slice(0, 20000);
    const title = field('title') ?? id;
    out.push(`INSERT INTO episodes VALUES (${[id, Number(field('episode')) || null, title, date, `${SITE}${path}.html`, audio, audioMeta[audio]?.seconds ?? null, c.kind, guests, companies, (c.topics ?? []).join(', '), c.hook, notes || title, ps.length ? 1 : 0].map(q).join(', ')});`);
    out.push(`INSERT INTO episodes_fts (id, title, guests, companies, hook, notes) VALUES (${[id, title, guests || ' ', companies || ' ', c.hook || ' ', notes || ' '].map(q).join(', ')});`);
    for (const p of ps) out.push(`INSERT INTO passages (episode_id, start, text) VALUES (${q(id)}, ${p.start}, ${q(p.text)});`);
    episodes++; passages += ps.length; if (ps.length) withTranscript++;
  }
  out.push(`INSERT INTO passages_fts (rowid, text) SELECT rowid, text FROM passages;`);
  writeFileSync(join(ROOT, 'mcp/seed.sql'), out.join('\n') + '\n');
  console.log(`mcp/seed.sql: ${episodes} episodes, ${withTranscript} with a transcript, ${passages} passages`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
