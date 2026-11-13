// WebVTT transcript, one file per episode that has a transcript in /transcripts.
import { getAllPosts } from '../../lib/posts';
import { transcriptToVtt, type TranscriptLine } from '../../lib/episode';
import { getTranscript } from '../../lib/transcripts';
import { getAudioMeta } from '../../lib/audioMeta';

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts
		.map((post) => ({ post, lines: getTranscript(post.id) }))
		.filter(({ post, lines }) => post.data.audio_url && lines.length > 0)
		.map(({ post, lines }) => ({
			params: { id: post.id },
			props: { lines, seconds: getAudioMeta(post.data.audio_url)?.seconds },
		}));
}

export function GET({ props }: { props: { lines: TranscriptLine[]; seconds?: number } }) {
	return new Response(transcriptToVtt(props.lines, props.seconds), {
		headers: { 'Content-Type': 'text/vtt; charset=utf-8' },
	});
}
