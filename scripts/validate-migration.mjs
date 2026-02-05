import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'https://www.reversim.com';
const SITEMAP_INDEX = `${BASE_URL}/sitemap.xml`;
const OUTPUT_DIR = path.resolve('src/content/posts');

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});

const toArray = (value) => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

async function fetchText(url) {
	const response = await fetch(url, {
		headers: {
			'user-agent': 'reversim-migration-bot/1.0',
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.text();
}

async function loadSitemapUrls() {
	const indexXml = await fetchText(SITEMAP_INDEX);
	const indexData = parser.parse(indexXml);
	const sitemapNodes = toArray(indexData?.sitemapindex?.sitemap);
	const sitemapUrls = sitemapNodes.map((node) => node.loc).filter(Boolean);

	const urlSets = await Promise.all(
		sitemapUrls.map(async (sitemapUrl) => {
			const sitemapXml = await fetchText(sitemapUrl);
			const sitemapData = parser.parse(sitemapXml);
			const urlNodes = toArray(sitemapData?.urlset?.url);
			return urlNodes.map((node) => node.loc).filter(Boolean);
		})
	);

	return Array.from(new Set(urlSets.flat())).filter((url) => url.includes(BASE_URL));
}

async function run() {
	const urls = await loadSitemapUrls();
	const files = await fs.readdir(OUTPUT_DIR);
	const markdownFiles = files.filter((file) => file.endsWith('.md'));

	console.log(`Sitemap URLs: ${urls.length}`);
	console.log(`Markdown files: ${markdownFiles.length}`);

	if (urls.length !== markdownFiles.length) {
		console.log('Counts differ. Check migration-errors.json or re-run migration.');
	}
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
