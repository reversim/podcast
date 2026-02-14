#!/usr/bin/env node

/**
 * check-links.mjs
 *
 * Scans all podcast markdown files for URLs (audio_url from frontmatter and
 * links found in the markdown body), performs HTTP HEAD requests to verify
 * accessibility, and reports broken links as JSON to stdout.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from "p-limit";

const POSTS_DIR = "/home/user/podcast/src/content/posts";
const CONCURRENCY = 50;
const TIMEOUT_MS = 5_000;
const BODY_URL_SAMPLE_SIZE = 100;
const AUDIO_SAMPLE_SIZE = 150; // sample across all domains instead of checking every URL

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter (between --- markers) and the remaining body from
 * a markdown string.  We only need a handful of scalar fields so a minimal
 * key: value parser is sufficient – no need for a full YAML library.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const body = content.slice(match[0].length);
  const fm = {};

  for (const line of raw.split("\n")) {
    const kv = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (kv) {
      fm[kv[1]] = kv[2].trim();
    }
  }

  return { frontmatter: fm, body };
}

/**
 * Extract all http(s) URLs from a block of text.
 */
function extractUrls(text) {
  const re = /https?:\/\/[^\s<>"')\]},;]+/gi;
  return [...(text.match(re) || [])];
}

/**
 * Check whether a URL is well-formed (starts with http:// or https://).
 */
function isWellFormedUrl(url) {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Perform an HTTP HEAD request and return { url, status, ok, error }.
 * Follows up to 5 redirects.  2xx and 3xx are considered "working".
 */
async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "podcast-link-checker/1.0",
      },
    });

    clearTimeout(timer);

    const ok = res.status >= 200 && res.status < 400;
    return { url, status: res.status, ok, error: null };
  } catch (err) {
    clearTimeout(timer);

    let error = err.message || String(err);
    if (err.name === "AbortError") error = "timeout";
    if (err.cause) {
      const cause = err.cause;
      if (cause.code === "ENOTFOUND") error = "DNS lookup failed";
      else if (cause.code === "ECONNREFUSED") error = "connection refused";
      else if (cause.code === "ECONNRESET") error = "connection reset";
      else if (cause.code) error = cause.code;
    }

    return { url, status: null, ok: false, error };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Read all markdown files
  const entries = await readdir(POSTS_DIR);
  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  // Collect data from every file
  const audioEntries = [];          // { url, file, malformed? }
  const bodyUrlMap = new Map();     // url -> Set<file>

  for (const filename of mdFiles) {
    const filepath = join(POSTS_DIR, filename);
    const raw = await readFile(filepath, "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);

    // audio_url
    if ("audio_url" in frontmatter) {
      audioEntries.push({
        url: frontmatter.audio_url,
        file: filename,
      });
    }

    // body URLs
    const bodyUrls = extractUrls(body);
    for (const u of bodyUrls) {
      if (!bodyUrlMap.has(u)) bodyUrlMap.set(u, new Set());
      bodyUrlMap.get(u).add(filename);
    }
  }

  // 2. Classify audio URLs
  const malformedAudio = audioEntries.filter((e) => !isWellFormedUrl(e.url));
  const validAudio = audioEntries.filter((e) => isWellFormedUrl(e.url));

  // 3. Sample audio URLs across domains, then check with concurrency limit
  const limit = pLimit(CONCURRENCY);

  // Group by domain and sample proportionally
  const byDomain = new Map();
  for (const e of validAudio) {
    try {
      const d = new URL(e.url).hostname;
      if (!byDomain.has(d)) byDomain.set(d, []);
      byDomain.get(d).push(e);
    } catch { /* skip */ }
  }

  const sampled = [];
  for (const [domain, entries] of byDomain) {
    const proportion = Math.max(5, Math.ceil((entries.length / validAudio.length) * AUDIO_SAMPLE_SIZE));
    // Take first few, last few, and random middle
    const first = entries.slice(0, Math.ceil(proportion / 3));
    const last = entries.slice(-Math.ceil(proportion / 3));
    const mid = entries.filter((_, i) => i % Math.max(1, Math.floor(entries.length / Math.ceil(proportion / 3))) === 0).slice(0, Math.ceil(proportion / 3));
    const unique = new Map();
    for (const e of [...first, ...mid, ...last]) unique.set(e.url, e);
    sampled.push(...unique.values());
  }

  process.stderr.write(`Checking ${sampled.length} sampled audio URLs (of ${validAudio.length} total) across ${byDomain.size} domains...\n`);

  const audioResults = await Promise.all(
    sampled.map((entry) =>
      limit(async () => {
        const result = await checkUrl(entry.url);
        return { ...result, file: entry.file };
      })
    )
  );

  const workingAudio = audioResults.filter((r) => r.ok);
  const brokenAudio = audioResults.filter((r) => !r.ok);

  // 4. Sample body URLs (first 100 unique) and check them
  const allBodyUrls = [...bodyUrlMap.keys()];
  const sampledBodyUrls = allBodyUrls.slice(0, BODY_URL_SAMPLE_SIZE);

  const bodyResults = await Promise.all(
    sampledBodyUrls.map((url) =>
      limit(async () => {
        const result = await checkUrl(url);
        return { ...result, files: [...bodyUrlMap.get(url)] };
      })
    )
  );

  const workingBody = bodyResults.filter((r) => r.ok);
  const brokenBody = bodyResults.filter((r) => !r.ok);

  // 5. Build report
  const report = {
    audio: {
      total: audioEntries.length,
      totalValid: validAudio.length,
      sampledCount: sampled.length,
      domainBreakdown: Object.fromEntries([...byDomain].map(([d, es]) => [d, es.length])),
      working: workingAudio.length,
      broken: brokenAudio.length,
      malformed: malformedAudio.map((e) => ({
        url: e.url ?? null,
        file: e.file,
        reason:
          e.url === "" || e.url === undefined || e.url === null
            ? "empty string"
            : "malformed URL",
      })),
      brokenList: brokenAudio.map((r) => ({
        url: r.url,
        status: r.status,
        error: r.error,
        file: r.file,
      })),
    },
    body: {
      totalUniqueUrls: allBodyUrls.length,
      sampledCount: sampledBodyUrls.length,
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

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
