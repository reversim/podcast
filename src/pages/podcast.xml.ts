import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import { getAllPosts, getPostPermalink } from '../lib/posts';

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
		items: posts.map((post) => {
			const enclosure = post.data.audio_url
				? `<enclosure url="${post.data.audio_url}" length="0" type="audio/mpeg" />`
				: '';
			const body = post.body ?? '';
			const description = post.data.summary
				? post.data.summary
				: sanitizeHtml(body, { allowedTags: [], allowedAttributes: {} }).slice(0, 1000).trim();
			return {
				title: post.data.title,
				pubDate: post.data.date,
				link: getPostPermalink(post),
				description,
				customData: `${enclosure}`,
			};
		}),
		customData: `
			<language>he</language>
			<itunes:author>רברס עם פלטפורמה</itunes:author>
			<itunes:explicit>false</itunes:explicit>
			<itunes:image href="${import.meta.env.SITE}/podcast-cover.png" />
			<itunes:category text="Technology" />
		`,
	});
}
