import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { getAllPosts, getPostPermalink } from '../lib/posts';
import { formatDuration, parseChapters, xmlEscape } from '../lib/episode';
import { getAudioMeta } from '../lib/audioMeta';
import { getTranscript } from '../lib/transcripts';
import { catalog } from '../lib/catalog';

// The address that the directories hold for this feed. podcast:guid is the UUIDv5 of this address without the scheme
// (namespace ead4c236-bf58-58c6-a2c6-a6b28d128cb6, see the Podcasting 2.0 specification). Do not change it.
const FEED_URL = 'https://www.reversim.com/podcast.xml';
const PODCAST_GUID = '148e4d86-db7c-535e-9265-130a55474cc2';
const HOSTS = ['Ran Tavory', 'Ori Lahav'];

const ALLOWED_TAGS = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4'];

async function bodyToHtml(body: string): Promise<string> {
	const html = await marked(body);
	return sanitizeHtml(html, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: { a: ['href'] },
	});
}

export async function GET(context: { site: URL }) {
	const posts = (await getAllPosts()).filter((post) => post.data.audio_url);

	return rss({
		title: 'רברס עם פלטפורמה',
		description: 'פודקאסט על תוכנה, מוצר, ותשתיות — בעברית.',
		site: import.meta.env.SITE,
		trailingSlash: false,
		xmlns: {
			itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
			podcast: 'https://podcastindex.org/namespace/1.0',
			atom: 'http://www.w3.org/2005/Atom',
		},
		items: await Promise.all(posts.map(async (post) => {
			const site = String(import.meta.env.SITE).replace(/\/$/, '');
			const meta = getAudioMeta(post.data.audio_url);
			const extras = [
				`<enclosure url="${xmlEscape(post.data.audio_url as string)}" length="${meta?.bytes ?? 0}" type="audio/mpeg" />`,
			];
			if (meta) extras.push(`<itunes:duration>${formatDuration(meta.seconds)}</itunes:duration>`);
			if (post.data.episode) extras.push(`<itunes:episode>${post.data.episode}</itunes:episode>`);
			extras.push('<itunes:episodeType>full</itunes:episodeType>');
			for (const guest of catalog[post.id]?.guests ?? []) {
				const name = guest.name_en || guest.name_he;
				if (name) extras.push(`<podcast:person role="guest">${xmlEscape(name)}</podcast:person>`);
			}
			if (parseChapters(post.body ?? '').length > 0) {
				extras.push(`<podcast:chapters url="${site}/chapters/${post.id}.json" type="application/json+chapters" />`);
			}
			if (getTranscript(post.id).length > 0) {
				extras.push(`<podcast:transcript url="${site}/transcripts/${post.id}.vtt" type="text/vtt" language="he" />`);
			}
			const description = post.data.summary
				? post.data.summary
				: await bodyToHtml(post.body ?? '');
			return {
				title: post.data.title,
				pubDate: post.data.date,
				link: getPostPermalink(post),
				description,
				customData: extras.join(''),
			};
		})),
		customData: `
			<language>he</language>
			<atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
			<podcast:guid>${PODCAST_GUID}</podcast:guid>
			<podcast:locked owner="team@reversim.com">yes</podcast:locked>
			<podcast:medium>podcast</podcast:medium>
			${HOSTS.map((name) => `<podcast:person role="host">${name}</podcast:person>`).join('')}
			<itunes:type>episodic</itunes:type>
			<itunes:author>רברס עם פלטפורמה</itunes:author>
			<itunes:owner>
				<itunes:name>רברס עם פלטפורמה</itunes:name>
				<itunes:email>team@reversim.com</itunes:email>
			</itunes:owner>
			<itunes:explicit>false</itunes:explicit>
			<itunes:image href="${import.meta.env.SITE}/podcast-cover.png" />
			<itunes:category text="Technology" />
		`,
	});
}
