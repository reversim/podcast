import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { withBase } from './urls';

export type PostEntry = CollectionEntry<'posts'>;

export async function getAllPosts() {
	const posts = await getCollection('posts', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getPostPath(entry: PostEntry) {
	if (entry.data.legacy_path) {
		return entry.data.legacy_path.startsWith('/')
			? entry.data.legacy_path
			: `/${entry.data.legacy_path}`;
	}
	const year = entry.data.date.getFullYear();
	const month = String(entry.data.date.getMonth() + 1).padStart(2, '0');
	return `/${year}/${month}/${entry.slug}`;
}

export function getPostPermalink(entry: PostEntry) {
	return withBase(`${getPostPath(entry)}.html`);
}
