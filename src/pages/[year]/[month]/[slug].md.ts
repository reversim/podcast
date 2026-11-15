// Markdown copy of each post, for AI agents: /YYYY/MM/slug.md next to /YYYY/MM/slug.html.
import { getAllPosts, getPostPath, type PostEntry } from '../../../lib/posts';
import { episodeMarkdown } from '../../../lib/agents';
import { toAgentEpisode } from '../../../lib/agentEpisodes';
import { getTranscript } from '../../../lib/transcripts';

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts.map((post) => {
		const [year, month, slug] = getPostPath(post).replace(/^\//, '').split('/');
		return { params: { year, month, slug }, props: { post } };
	});
}

export function GET({ props }: { props: { post: PostEntry } }) {
	const { post } = props;
	const transcript = post.data.audio_url ? getTranscript(post.id) : [];
	return new Response(episodeMarkdown(toAgentEpisode(post), post.body ?? '', transcript), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
}
