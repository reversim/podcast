#!/usr/bin/env node
// Fills src/data/audio-meta.json with the size (bytes) and duration (seconds) of each episode's audio file.
// The podcast feed uses it for <enclosure length> and <itunes:duration>.
// Run: node scripts/audio-meta.mjs            (only episodes that are missing)
//      node scripts/audio-meta.mjs --all      (measure all again)
// Needs ffprobe. It sends a HEAD request and lets ffprobe read the file header; it does not download the audio.
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src/content/posts');
export const META_FILE = join(ROOT, 'src/data/audio-meta.json');
const UA = 'reversim-audio-meta/1.0 (bot)';

export function loadMeta() {
	return existsSync(META_FILE) ? JSON.parse(readFileSync(META_FILE, 'utf8')) : {};
}

export function saveMeta(meta) {
	mkdirSync(dirname(META_FILE), { recursive: true });
	const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
	writeFileSync(META_FILE, JSON.stringify(sorted, null, '\t') + '\n');
}

function audioUrls() {
	const urls = [];
	for (const f of readdirSync(POSTS)) {
		if (!f.endsWith('.md')) continue;
		const head = readFileSync(join(POSTS, f), 'utf8').split('\n---')[0];
		const m = /^audio_url:\s*["']?(\S+?)["']?\s*$/m.exec(head);
		if (m) urls.push(m[1]);
	}
	return urls;
}

async function measure(url) {
	const res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': UA }, redirect: 'follow' });
	if (!res.ok) throw new Error(`HEAD ${res.status}`);
	const bytes = Number(res.headers.get('content-length')) || 0;
	const { stdout } = await run('ffprobe', ['-v', 'error', '-user_agent', UA, '-show_entries', 'format=duration', '-of', 'csv=p=0', url], { timeout: 60000 });
	const seconds = Math.round(Number(stdout.trim()));
	if (!bytes || !Number.isFinite(seconds) || seconds <= 0) throw new Error(`bad values: bytes=${bytes} seconds=${stdout.trim()}`);
	return { bytes, seconds };
}

async function main() {
	const all = process.argv.includes('--all');
	const meta = loadMeta();
	const todo = audioUrls().filter((u) => all || !meta[u]);
	console.log(`${todo.length} audio files to measure`);
	let done = 0, failed = 0;
	const queue = [...todo];
	const worker = async () => {
		for (let url = queue.shift(); url; url = queue.shift()) {
			try {
				meta[url] = await measure(url);
			} catch (e) {
				failed++;
				console.warn(`  skip ${url}: ${e.message}`);
			}
			if (++done % 50 === 0) { console.log(`  ${done}/${todo.length}`); saveMeta(meta); }
		}
	};
	await Promise.all(Array.from({ length: 6 }, worker));
	saveMeta(meta);
	console.log(`Done: ${done - failed} measured, ${failed} failed, ${Object.keys(meta).length} total in ${META_FILE}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().catch((e) => { console.error(e); process.exit(1); });
}
