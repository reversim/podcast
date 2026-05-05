import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { getAllPosts, getPostPermalink } from '../lib/posts';

const ALLOWED_TAGS = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4'];

async function bodyToHtml(body: string): Promise<string> {
	const html = await marked(body);
	return sanitizeHtml(html, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: { a: ['href'] },
	});
}

export async function GET(context: { site: URL }) {
	const posts = (await getAllPosts()).filter((post) => post.data.audio_url);

	return rss({
		title: 'רברס עם פלטפורמה',
		description: 'פודקאסט על תוכנה, מוצר, ותשתיות — בעברית.',
		site: import.meta.env.SITE,
		trailingSlash: false,
		xmlns: {
			itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
		},
		items: await Promise.all(posts.map(async (post) => {
			const enclosure = post.data.audio_url
				? `<enclosure url="${post.data.audio_url}" length="0" type="audio/mpeg" />`
				: '';
			const description = post.data.summary
				? post.data.summary
				: await bodyToHtml(post.body ?? '');
			return {
				title: post.data.title,
				pubDate: post.data.date,
				link: getPostPermalink(post),
				description,
				customData: `${enclosure}`,
			};
		})),
		customData: `
			<language>he</language>
			<itunes:author>רברס עם פלטפורמה</itunes:author>
			<itunes:explicit>false</itunes:explicit>
			<itunes:image href="${import.meta.env.SITE}/podcast-cover.png" />
			<itunes:category text="Technology" />
		`,
	});
}
