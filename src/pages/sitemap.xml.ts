import { getAllPosts, getPostPermalink } from '../lib/posts';

const PAGE_SIZE = 12; // keep in sync with src/pages/page/[page].astro

export async function GET({ site }: { site: URL }) {
	const posts = await getAllPosts();
	const pageCount = Math.ceil(posts.length / PAGE_SIZE);
	const entries: { loc: string; lastmod?: string }[] = [
		{ loc: '/' },
		{ loc: '/about.html' },
		{ loc: '/archive.html' },
		{ loc: '/episodes.html' },
		...Array.from({ length: pageCount }, (_, i) => ({ loc: `/page/${i + 1}.html` })),
		...posts.map((post) => ({
			loc: getPostPermalink(post),
			lastmod: post.data.date.toISOString().slice(0, 10),
		})),
	];
	const body = entries
		.map(({ loc, lastmod }) => {
			const url = new URL(loc, site).href;
			return `<url><loc>${url}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
		})
		.join('\n');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
}
