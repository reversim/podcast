#!/usr/bin/env node

/**
 * check-links.mjs
 *
 * Scans all markdown posts for URLs (audio_url from frontmatter and links in
 * markdown body), validates them via HTTP HEAD, and outputs a JSON report.
 *
 * Usage:
 *   node scripts/check-links.mjs
 *   node scripts/check-links.mjs --full --out reports/link-check-full.json
 *   node scripts/check-links.mjs --full --concurrency 40 --timeout 8000
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";

const DEFAULT_CONCURRENCY = 50;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_BODY_SAMPLE_SIZE = 100;
const DEFAULT_AUDIO_SAMPLE_SIZE = 150;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");
const POSTS_DIR = resolve(ROOT_DIR, "src/content/posts");

function parseArgs(argv) {
  const args = {
    full: false,
    out: null,
    concurrency: DEFAULT_CONCURRENCY,
    timeout: DEFAULT_TIMEOUT_MS,
    audioStart: 0,
    audioCount: null,
    bodyStart: 0,
    bodyCount: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--full") args.full = true;
    else if (a === "--out" && argv[i + 1]) {
      args.out = argv[i + 1];
      i += 1;
    } else if (a === "--concurrency" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.concurrency = Number.isNaN(n) ? DEFAULT_CONCURRENCY : n;
      i += 1;
    } else if (a === "--timeout" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.timeout = Number.isNaN(n) ? DEFAULT_TIMEOUT_MS : n;
      i += 1;
    } else if (a === "--audio-start" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.audioStart = Number.isNaN(n) ? 0 : n;
      i += 1;
    } else if (a === "--audio-count" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.audioCount = Number.isNaN(n) ? null : n;
      i += 1;
    } else if (a === "--body-start" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.bodyStart = Number.isNaN(n) ? 0 : n;
      i += 1;
    } else if (a === "--body-count" && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      args.bodyCount = Number.isNaN(n) ? null : n;
      i += 1;
    }
  }

  return args;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const body = content.slice(match[0].length);
  const fm = {};

  for (const line of raw.split("\n")) {
    const kv = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }

  return { frontmatter: fm, body };
}

function extractUrls(text) {
  const re = /https?:\/\/[^\s<>"')\]},;]+/gi;
  return [...(text.match(re) || [])];
}

function isWellFormedUrl(url) {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function checkUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "podcast-link-checker/1.0" },
    });
    clearTimeout(timer);
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400, error: null };
  } catch (err) {
    clearTimeout(timer);
    let error = err?.message || String(err);
    if (err?.name === "AbortError") error = "timeout";
    if (err?.cause?.code === "ENOTFOUND") error = "DNS lookup failed";
    else if (err?.cause?.code === "ECONNREFUSED") error = "connection refused";
    else if (err?.cause?.code === "ECONNRESET") error = "connection reset";
    else if (err?.cause?.code) error = err.cause.code;
    return { url, status: null, ok: false, error };
  }
}

async function runBatched(items, batchSize, worker) {
  const results = [];
  let completed = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await worker(item);
        completed += 1;
        if (completed % 50 === 0 || completed === items.length) {
          process.stderr.write(`Heartbeat: ${completed}/${items.length}\n`);
        }
        return result;
      })
    );
    results.push(...batchResults);
    process.stderr.write(`Progress: ${Math.min(i + batch.length, items.length)}/${items.length}\n`);
  }
  return results;
}

function uniqueByUrl(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.url)) map.set(e.url, { url: e.url, files: [] });
    map.get(e.url).files.push(e.file);
  }
  return map;
}

function sampleAudioByDomain(validAudioEntries, sampleSize) {
  const byDomain = new Map();
  for (const e of validAudioEntries) {
    const d = new URL(e.url).hostname;
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(e);
  }

  const sampled = [];
  for (const entries of byDomain.values()) {
    const proportion = Math.max(5, Math.ceil((entries.length / validAudioEntries.length) * sampleSize));
    const first = entries.slice(0, Math.ceil(proportion / 3));
    const last = entries.slice(-Math.ceil(proportion / 3));
    const step = Math.max(1, Math.floor(entries.length / Math.max(1, Math.ceil(proportion / 3))));
    const mid = entries.filter((_, i) => i % step === 0).slice(0, Math.ceil(proportion / 3));
    const unique = new Map();
    for (const e of [...first, ...mid, ...last]) unique.set(e.url, e);
    sampled.push(...unique.values());
  }

  return { sampled, byDomain };
}

async function main() {
  const args = parseArgs(process.argv);
  const limit = pLimit(args.concurrency);

  const entries = await readdir(POSTS_DIR);
  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  const audioEntries = []; // { url, file }
  const bodyUrlMap = new Map(); // url -> Set(files)

  for (const filename of mdFiles) {
    const filepath = join(POSTS_DIR, filename);
    const raw = await readFile(filepath, "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);

    if ("audio_url" in frontmatter) {
      audioEntries.push({ url: frontmatter.audio_url, file: filename });
    }

    for (const url of extractUrls(body)) {
      if (!bodyUrlMap.has(url)) bodyUrlMap.set(url, new Set());
      bodyUrlMap.get(url).add(filename);
    }
  }

  const malformedAudio = audioEntries.filter((e) => !isWellFormedUrl(e.url));
  const validAudio = audioEntries.filter((e) => isWellFormedUrl(e.url));

  const domainBreakdown = {};
  for (const e of validAudio) {
    const d = new URL(e.url).hostname;
    domainBreakdown[d] = (domainBreakdown[d] || 0) + 1;
  }

  const rawAudioToCheck = args.full
    ? validAudio
    : sampleAudioByDomain(validAudio, DEFAULT_AUDIO_SAMPLE_SIZE).sampled;
  const audioEnd =
    args.audioCount === null ? undefined : args.audioStart + Math.max(0, args.audioCount);
  const audioToCheck = rawAudioToCheck.slice(args.audioStart, audioEnd);

  const uniqueAudioMap = uniqueByUrl(audioToCheck);
  const uniqueAudioUrls = [...uniqueAudioMap.keys()];
  process.stderr.write(
    `Checking ${uniqueAudioUrls.length} unique audio URLs (${args.full ? "full" : "sampled"})...\n`
  );

  const audioResults = await runBatched(
    uniqueAudioUrls,
    250,
    (url) => limit(() => checkUrl(url, args.timeout))
  );

  const audioResultMap = new Map(audioResults.map((r) => [r.url, r]));
  const expandedAudioResults = uniqueAudioUrls.map((url) => ({
    ...audioResultMap.get(url),
    files: uniqueAudioMap.get(url).files,
  }));

  const workingAudio = expandedAudioResults.filter((r) => r.ok);
  const brokenAudio = expandedAudioResults.filter((r) => !r.ok);

  const allBodyUrls = [...bodyUrlMap.keys()];
  const rawBodyToCheck = args.full ? allBodyUrls : allBodyUrls.slice(0, DEFAULT_BODY_SAMPLE_SIZE);
  const bodyEnd =
    args.bodyCount === null ? undefined : args.bodyStart + Math.max(0, args.bodyCount);
  const bodyToCheck = rawBodyToCheck.slice(args.bodyStart, bodyEnd);
  process.stderr.write(
    `Checking ${bodyToCheck.length} unique body URLs (${args.full ? "full" : "sampled"})...\n`
  );

  const bodyResults = await runBatched(
    bodyToCheck,
    250,
    (url) =>
      limit(async () => ({
        ...(await checkUrl(url, args.timeout)),
        files: [...bodyUrlMap.get(url)],
      }))
  );

  const workingBody = bodyResults.filter((r) => r.ok);
  const brokenBody = bodyResults.filter((r) => !r.ok);

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      rootDir: ROOT_DIR,
      postsDir: POSTS_DIR,
      mode: args.full ? "full" : "sampled",
      concurrency: args.concurrency,
      timeoutMs: args.timeout,
      scannedMarkdownFiles: mdFiles.length,
      audioStart: args.audioStart,
      audioCount: args.audioCount,
      bodyStart: args.bodyStart,
      bodyCount: args.bodyCount,
    },
    audio: {
      totalEntries: audioEntries.length,
      totalValidEntries: validAudio.length,
      totalMalformedEntries: malformedAudio.length,
      checkedUniqueUrls: uniqueAudioUrls.length,
      domainBreakdown,
      working: workingAudio.length,
      broken: brokenAudio.length,
      malformed: malformedAudio.map((e) => ({
        url: e.url ?? null,
        file: e.file,
        reason: e.url === "" || e.url === undefined || e.url === null ? "empty string" : "malformed URL",
      })),
      brokenList: brokenAudio.map((r) => ({
        url: r.url,
        status: r.status,
        error: r.error,
        files: r.files,
      })),
    },
    body: {
      totalUniqueUrls: allBodyUrls.length,
      checkedUniqueUrls: bodyToCheck.length,
      working: workingBody.length,
      broken: brokenBody.length,
      brokenList: brokenBody.map((r) => ({
        url: r.url,
        status: r.status,
        error: r.error,
        files: r.files,
      })),
    },
  };

  const json = JSON.stringify(report, null, 2);

  if (args.out) {
    const outPath = resolve(ROOT_DIR, args.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, json, "utf8");
    process.stderr.write(`Full report written to: ${outPath}\n`);
  }

  console.log(json);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
