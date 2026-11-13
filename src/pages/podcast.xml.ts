import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { getAllPosts, getPostPermalink } from '../lib/posts';
import { formatDuration, parseChapters, xmlEscape } from '../lib/episode';
import { getAudioMeta } from '../lib/audioMeta';
import { getTranscript } from '../lib/transcripts';

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
		},
		items: await Promise.all(posts.map(async (post) => {
			const site = String(import.meta.env.SITE).replace(/\/$/, '');
			const meta = getAudioMeta(post.data.audio_url);
			const extras = [
				`<enclosure url="${xmlEscape(post.data.audio_url as string)}" length="${meta?.bytes ?? 0}" type="audio/mpeg" />`,
			];
			if (meta) extras.push(`<itunes:duration>${formatDuration(meta.seconds)}</itunes:duration>`);
			if (post.data.episode) extras.push(`<itunes:episode>${post.data.episode}</itunes:episode>`);
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
