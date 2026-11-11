import { getAllPosts, getPostPermalink } from '../lib/posts';

export async function GET() {
	const site = (import.meta.env.SITE ?? 'https://www.reversim.com').replace(/\/$/, '');
	const posts = (await getAllPosts()).filter((post) => post.data.audio_url);
	const episodes = posts.map((post) => {
		const audio = post.data.audio_url as string;
		let file = audio;
		try {
			file = decodeURIComponent(new URL(audio).pathname.split('/').pop() ?? audio);
		} catch {
			file = audio.split('?')[0].split('/').pop() ?? audio;
		}
		return {
			episode: post.data.episode ?? null,
			title: post.data.title,
			date: post.data.date.toISOString(),
			file,
			url: `${site}${getPostPermalink(post)}`,
		};
	});
	return new Response(JSON.stringify(episodes), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
