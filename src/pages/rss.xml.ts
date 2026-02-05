import rss from '@astrojs/rss';
import { getAllPosts, getPostPermalink } from '../lib/posts';

export async function GET() {
	const posts = await getAllPosts();
	return rss({
		title: 'רברס עם פלטפורמה',
		description: 'פודקאסט על תוכנה, מוצר, ותשתיות — בעברית.',
		site: import.meta.env.SITE,
		trailingSlash: false,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.date,
			link: getPostPermalink(post),
			description: post.data.summary ?? '',
			content: post.body,
		})),
		customData: `<language>he</language>`,
	});
}
