// Podcasting 2.0 chapters, one JSON file per episode that has "**[MM:SS] Title**" headings.
import { getAllPosts } from '../../lib/posts';
import { chaptersJson, parseChapters } from '../../lib/episode';

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts
		.map((post) => ({ post, chapters: parseChapters(post.body ?? '') }))
		.filter(({ post, chapters }) => post.data.audio_url && chapters.length > 0)
		.map(({ post, chapters }) => ({ params: { id: post.id }, props: { chapters } }));
}

export function GET({ props }: { props: { chapters: ReturnType<typeof parseChapters> } }) {
	return new Response(JSON.stringify(chaptersJson(props.chapters)), {
		headers: { 'Content-Type': 'application/json+chapters; charset=utf-8' },
	});
}
