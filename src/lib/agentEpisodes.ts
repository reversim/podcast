// Collects the data that /llms.txt, /llms-full.txt and the .md copies need.
import { getAllPosts, getPostPath, type PostEntry } from './posts';
import { catalog } from './catalog';
import { getAudioMeta } from './audioMeta';
import { plainDescription } from './episode';
import type { AgentEpisode } from './agents';

export const SITE = (import.meta.env.SITE ?? 'https://www.reversim.com').replace(/\/$/, '');

export function toAgentEpisode(post: PostEntry): AgentEpisode {
	const entry = catalog[post.id];
	const path = getPostPath(post);
	return {
		id: post.id,
		title: post.data.title,
		date: post.data.date,
		episode: post.data.episode,
		audioUrl: post.data.audio_url,
		url: `${SITE}${path}.html`,
		markdownUrl: `${SITE}${path}.md`,
		summary: post.data.summary ?? (entry?.hook || plainDescription(post.body ?? '', 160) || undefined),
		entry,
		seconds: getAudioMeta(post.data.audio_url)?.seconds,
	};
}

export async function agentEpisodes(): Promise<AgentEpisode[]> {
	return (await getAllPosts()).filter((post) => post.data.audio_url).map(toAgentEpisode);
}
