import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import { parse } from 'yaml';

const ROOT = process.cwd();
const POSTS = join(ROOT, 'src/content/posts');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const toArr = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

async function getText(url) {
	const r = await fetch(url, { headers: { 'user-agent': 'rev-audit/1.0' } });
	if (!r.ok) throw new Error(`${url} ${r.status}`);
	return await r.text();
}

const idx = parser.parse(await getText('https://www.reversim.com/sitemap.xml'));
const smLocs = toArr(idx.sitemapindex?.sitemap)
	.map((s) => s.loc)
	.filter(Boolean);
let urls = [];
for (const sm of smLocs) {
	const d = parser.parse(await getText(sm));
	urls.push(...toArr(d.urlset?.url).map((u) => u.loc).filter(Boolean));
}
const sourceUrls = [...new Set(urls)].sort();

const localByLegacy = new Map();
const localByFile = [];
for (const f of readdirSync(POSTS)) {
	if (!f.endsWith('.md')) continue;
	const p = join(POSTS, f);
	const txt = readFileSync(p, 'utf8');
	if (!txt.startsWith('---\n')) continue;
	const end = txt.indexOf('\n---\n', 4);
	if (end < 0) continue;
	const fm = parse(txt.slice(4, end)) || {};
	localByFile.push({ file: f, fm });
	if (fm.legacy_url) localByLegacy.set(fm.legacy_url, { file: f, fm });
}

const sourceSet = new Set(sourceUrls);
const missing = sourceUrls.filter((u) => !localByLegacy.has(u));
const extra = [...localByLegacy.keys()].filter((u) => !sourceSet.has(u));

const sample = [...sourceUrls.slice(0, 60), ...sourceUrls.slice(-60)];
const titleMismatch = [];
const tagMismatch = [];
for (const u of sample) {
	const html = await getText(u);
	const $ = cheerio.load(html, { decodeEntities: false });
	const srcTitle = $('.post-title').first().text().trim();
	const srcTags = new Set(
		$('.post-labels a')
			.map((_, el) => $(el).text().trim())
			.get()
			.filter(Boolean)
	);
	const local = localByLegacy.get(u);
	const localTitle = (local?.fm?.title || '').trim();
	const localTags = new Set((local?.fm?.tags || []).map((t) => String(t).trim()).filter(Boolean));
	if (srcTitle !== localTitle) titleMismatch.push({ url: u, srcTitle, localTitle, file: local?.file });
	const s1 = [...srcTags].sort().join('||');
	const s2 = [...localTags].sort().join('||');
	if (s1 !== s2) {
		tagMismatch.push({
			url: u,
			srcTags: [...srcTags].sort(),
			localTags: [...localTags].sort(),
			file: local?.file,
		});
	}
}

const nonLegacy = localByFile.filter((x) => !x.fm.legacy_url).map((x) => x.file);
console.log(
	JSON.stringify(
		{
			source_urls: sourceUrls.length,
			local_files: localByFile.length,
			local_legacy_posts: localByLegacy.size,
			non_legacy_files: nonLegacy,
			missing_count: missing.length,
			extra_count: extra.length,
			missing_first: missing.slice(0, 5),
			extra_first: extra.slice(0, 5),
			sample_size: sample.length,
			title_mismatch_count: titleMismatch.length,
			tag_mismatch_count: tagMismatch.length,
			title_mismatch_first: titleMismatch.slice(0, 3),
			tag_mismatch_first: tagMismatch.slice(0, 3),
		},
		null,
		2
	)
);
