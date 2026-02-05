import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { stringify } from 'yaml';

const BASE_URL = 'https://www.reversim.com';
const SITEMAP_INDEX = `${BASE_URL}/sitemap.xml`;
const OUTPUT_DIR = path.resolve('src/content/posts');
const CONCURRENCY = 4;
const MAX_RETRIES = 4;

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});

const toArray = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url, attempt = 1) {
	const response = await fetch(url, {
		headers: {
			'user-agent': 'reversim-migration-bot/1.0',
		},
	});
	if (!response.ok) {
		if (attempt <= MAX_RETRIES && [429, 500, 502, 503, 504].includes(response.status)) {
			const backoff = 500 * attempt * attempt;
			await sleep(backoff);
			return fetchText(url, attempt + 1);
		}
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.text();
}

function extractPost(html, url) {
	const $ = cheerio.load(html, { decodeEntities: false });
	const title = $('.post-title').first().text().trim();
	const bodyEl = $('.post-body').first();
	const bodyHtml = bodyEl.html()?.trim() ?? '';

	const dateAttr = $('abbr.published').attr('title') ||
		$('meta[itemprop="datePublished"]').attr('content') ||
		$('time[itemprop="datePublished"]').attr('datetime');

	const labels = $('.post-labels a')
		.map((_, el) => $(el).text().trim())
		.get()
		.filter(Boolean);

	const audioUrl = bodyEl
		.find('a[href$=".mp3"], a[href*=".mp3?"]')
		.first()
		.attr('href');

	const coverImage = bodyEl.find('img').first().attr('src');

	const pathname = new URL(url).pathname;
	const segments = pathname.split('/').filter(Boolean);
	const year = segments[0] ?? '0000';
	const month = segments[1] ?? '00';
	const slug = segments[2]?.replace(/\.html$/, '') ?? '';
	const legacyPath = `/${year}/${month}/${slug}`;

	const episodeMatch = slug.match(/^(\d{1,4})[-_]/) || title.match(/^(\d{1,4})\b/);
	const episode = episodeMatch ? Number.parseInt(episodeMatch[1], 10) : undefined;

	return {
		frontmatter: {
			title,
			date: dateAttr ? new Date(dateAttr).toISOString() : undefined,
			tags: labels.length ? labels : undefined,
			episode: Number.isFinite(episode) ? episode : undefined,
			audio_url: audioUrl,
			cover_image: coverImage,
			legacy_url: url,
			legacy_path: legacyPath,
		},
		bodyHtml,
		fileName: `${year}-${month}-${slug || 'post'}.md`,
	};
}

async function loadSitemapUrls() {
	const indexXml = await fetchText(SITEMAP_INDEX);
	const indexData = parser.parse(indexXml);
	const sitemapNodes = toArray(indexData?.sitemapindex?.sitemap);
	const sitemapUrls = sitemapNodes.map((node) => node.loc).filter(Boolean);

	if (!sitemapUrls.length) {
		throw new Error('No sitemap URLs found.');
	}

	const urlSets = await Promise.all(
		sitemapUrls.map(async (sitemapUrl) => {
			const sitemapXml = await fetchText(sitemapUrl);
			const sitemapData = parser.parse(sitemapXml);
			const urlNodes = toArray(sitemapData?.urlset?.url);
			return urlNodes.map((node) => node.loc).filter(Boolean);
		})
	);

	const allUrls = Array.from(new Set(urlSets.flat()));
	return allUrls.filter((url) => url.includes(BASE_URL));
}

async function writePostFile({ frontmatter, bodyHtml, fileName }) {
	if (!frontmatter.title || !bodyHtml) {
		throw new Error(`Missing title or body for ${fileName}`);
	}

	const data = { ...frontmatter };
	if (!data.date) {
		throw new Error(`Missing date for ${fileName}`);
	}

	const yaml = stringify(data, { indent: 2 }).trim();
	const content = `---\n${yaml}\n---\n\n<div class=\"post-body\">\n${bodyHtml}\n</div>\n`;

	const outputPath = path.join(OUTPUT_DIR, fileName);
	await fs.writeFile(outputPath, content);
}

async function run() {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });
	const urls = await loadSitemapUrls();
	console.log(`Found ${urls.length} URLs in sitemap.`);

	const limit = pLimit(CONCURRENCY);
	const errors = [];

	await Promise.all(
		urls.map((url) =>
			limit(async () => {
				try {
					const pathname = new URL(url).pathname;
					const segments = pathname.split('/').filter(Boolean);
					const year = segments[0] ?? '0000';
					const month = segments[1] ?? '00';
					const slug = segments[2]?.replace(/\.html$/, '') ?? '';
					const outputPath = path.join(OUTPUT_DIR, `${year}-${month}-${slug || 'post'}.md`);
					try {
						await fs.access(outputPath);
						process.stdout.write('s');
						return;
					} catch {
						// continue
					}
					const html = await fetchText(url);
					const post = extractPost(html, url);
					await writePostFile(post);
					process.stdout.write('.');
				} catch (error) {
					errors.push({ url, error: error.message });
					process.stdout.write('E');
				}
			})
		)
	);

	console.log(`\nDone. Wrote ${urls.length - errors.length} posts.`);
	if (errors.length) {
		const errorPath = path.resolve('migration-errors.json');
		await fs.writeFile(errorPath, JSON.stringify(errors, null, 2));
		console.log(`Errors saved to ${errorPath}`);
	}
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
