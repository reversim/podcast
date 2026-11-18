// Large share image, one JPEG for each episode. The episode page points to it in og:image.
import { getAllPosts, type PostEntry } from '../../lib/posts';
import { localCoverFile } from '../../lib/episodeArt';
import { shareImage } from '../../lib/shareImage';

export async function getStaticPaths() {
	return (await getAllPosts())
		.filter((post) => post.data.audio_url)
		.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export async function GET({ props }: { props: { post: PostEntry } }) {
	const { post } = props;
	let image: Buffer;
	try {
		image = await shareImage(localCoverFile(post.data.cover_image), post.data.episode);
	} catch {
		// A cover that sharp cannot read must not stop the build.
		image = await shareImage(undefined, post.data.episode);
	}
	return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg' } });
}
