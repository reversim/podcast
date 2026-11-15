// Square episode art, one JPEG for each episode that has a local cover image. The podcast feed points to it.
import { getAllPosts, type PostEntry } from '../../lib/posts';
import { episodeArt, localCoverFile } from '../../lib/episodeArt';

export async function getStaticPaths() {
	return (await getAllPosts())
		.filter((post) => post.data.audio_url && localCoverFile(post.data.cover_image))
		.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export async function GET({ props }: { props: { post: PostEntry } }) {
	const { post } = props;
	const art = await episodeArt(localCoverFile(post.data.cover_image) as string, post.data.episode);
	return new Response(new Uint8Array(art), { headers: { 'Content-Type': 'image/jpeg' } });
}
