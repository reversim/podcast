import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { getAllPosts, getPostPermalink } from '../lib/posts';
import { cutHtml, formatDuration, parseChapters, xmlEscape } from '../lib/episode';
import { getAudioMeta } from '../lib/audioMeta';
import { getTranscript } from '../lib/transcripts';
import { catalog } from '../lib/catalog';
import { localCoverFile } from '../lib/episodeArt';

// The public address of the feed. It is a redirect to /podcast.xml, so the feed can move to another host
// and the directories keep the same address.
const FEED_URL = 'https://feed.reversim.com';
// podcast:guid is the UUIDv5 of "www.reversim.com/podcast.xml" (namespace ead4c236-bf58-58c6-a2c6-a6b28d128cb6,
// see the Podcasting 2.0 specification). It is permanent: do not change it, also if the feed address changes.
const PODCAST_GUID = '148e4d86-db7c-535e-9265-130a55474cc2';
const HOSTS = ['Ran Tavory', 'Ori Lahav'];

const ALLOWED_TAGS = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4'];

// Apple Podcasts permits 4,000 characters in a description. Long show notes made the feed 12 MB.
const MAX_DESCRIPTION = 4000;
const sanitize = (html: string) =>
	sanitizeHtml(html, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: { a: ['href'] },
	});

/** Show notes as feed HTML. Long notes stop at MAX_DESCRIPTION, with a link to the full notes on the site. */
async function bodyToHtml(body: string, permalink: string): Promise<string> {
	const html = sanitize(await marked(body));
	if (html.length <= MAX_DESCRIPTION) return html;
	// The second sanitize closes the tags that the cut left open.
	return `${sanitize(cutHtml(html, MAX_DESCRIPTION))}… <p><a href="${new URL(permalink, import.meta.env.SITE).href}">להמשך הערות הפרק באתר</a></p>`;
}

export async function GET(context: { site: URL }) {
	const posts = (await getAllPosts()).filter((post) => post.data.audio_url);

	return rss({
		// The Latin name is in the title so that a search for "reversim" finds the show in the podcast apps.
		title: 'רברס עם פלטפורמה (Reversim)',
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
			if (localCoverFile(post.data.cover_image)) extras.push(`<itunes:image href="${site}/episode-art/${post.id}.jpg" />`);
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
				: await bodyToHtml(post.body ?? '', getPostPermalink(post));
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
			<image><url>${import.meta.env.SITE}/podcast-cover.png</url><title>רברס עם פלטפורמה (Reversim)</title><link>${import.meta.env.SITE}</link></image>
			<itunes:category text="Technology" />
		`,
	});
}
