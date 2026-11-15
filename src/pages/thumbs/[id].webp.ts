// Small WebP copy of each local cover image, for the episode cards and the home page.
// The full images are up to 600 KB. A card shows them at about 320 px.
import { getAllPosts, type PostEntry } from '../../lib/posts';
import { coverThumb, hasThumb, localCoverFile } from '../../lib/episodeArt';

export async function getStaticPaths() {
	return (await getAllPosts())
		.filter((post) => hasThumb(post.data.cover_image))
		.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export async function GET({ props }: { props: { post: PostEntry } }) {
	const thumb = await coverThumb(localCoverFile(props.post.data.cover_image) as string);
	return new Response(new Uint8Array(thumb), { headers: { 'Content-Type': 'image/webp' } });
}
