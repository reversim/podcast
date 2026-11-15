// Plain-text and Markdown output for AI agents: /llms.txt, /llms-full.txt and a .md copy of each post.
// Pure functions only (no Astro imports), so vitest can test them.
import * as cheerio from 'cheerio';
import { formatTime, type TranscriptLine } from './episode';
import type { CatalogEntry } from './catalog';

export const MCP_URL = 'https://mcp.reversim.com/mcp';

/** Blogger HTML or Markdown-with-HTML → compact Markdown. Keeps headings, lists, links and text. */
export function htmlToMarkdown(html: string): string {
	// New posts are Markdown already. Only Blogger posts need the conversion.
	if ((html.match(/<(div|p|br|span|ul|ol|li|table|font|h[1-6])\b/gi) ?? []).length < 5) {
		return html
			.replace(/<(script|style|iframe)\b[\s\S]*?<\/\1>/gi, '')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}
	const $ = cheerio.load(`<div id="root">${html}</div>`, null, false);
	$('script, style, iframe, object, embed, audio, video, noscript').remove();
	const inline = (el: any): string => {
		let out = '';
		for (const node of el.contents().toArray() as any[]) {
			if (node.type === 'text') {
				out += node.data.replace(/\s+/g, ' ');
				continue;
			}
			if (node.type !== 'tag') continue;
			const child = $(node);
			const name = node.name.toLowerCase();
			if (name === 'br') out += '\n';
			else if (name === 'a') {
				const text = inline(child).replace(/\s+/g, ' ').trim();
				const href = (child.attr('href') ?? '').trim();
				if (!text) continue;
				out += href && !href.startsWith('javascript:') && href !== text ? `[${text}](${href})` : text;
			} else if (name === 'img') {
				const alt = (child.attr('alt') ?? '').trim();
				if (alt) out += alt;
			} else if (/^h[1-6]$/.test(name)) out += `\n\n${'#'.repeat(Math.max(2, Number(name[1])))} ${inline(child).trim()}\n\n`;
			else if (name === 'li') {
				// A list item of <ol> keeps its number.
				const marker = node.parent?.name === 'ol' ? `${child.prevAll('li').length + 1}.` : '-';
				out += `\n${marker} ${inline(child).trim().replace(/\n+/g, '\n  ')}`;
			}
			else if (name === 'b' || name === 'strong') {
				const text = inline(child);
				// Spaces go outside the markers: "<b>a </b>b" must not become "**a**b".
				out += text.trim() && !text.includes('\n') ? text.replace(/^(\s*)([\s\S]*?)(\s*)$/, '$1**$2**$3') : text;
			} else if (name === 'td' || name === 'th') out += `${inline(child)} `;
			else if (['p', 'div', 'ul', 'ol', 'blockquote', 'table', 'tr', 'section'].includes(name)) out += `\n\n${inline(child)}\n\n`;
			else out += inline(child);
		}
		return out;
	};
	return inline($('#root'))
		.replace(/ /g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		// Remove indentation, but keep all of it before a list marker (nested lists).
		.replace(/\n[ \t]+(?![ \t]|-|\d+\.)/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export interface AgentEpisode {
	id: string;
	title: string;
	date: Date;
	episode?: number;
	audioUrl?: string;
	url: string; // absolute URL of the HTML page
	markdownUrl: string; // absolute URL of the Markdown copy
	summary?: string;
	entry?: CatalogEntry;
	seconds?: number;
}

const guestLine = (entry?: CatalogEntry) =>
	(entry?.guests ?? [])
		.map((g) => [g.name_en || g.name_he, g.name_en && g.name_he ? `(${g.name_he})` : '', g.role || g.company ? `— ${[g.role, g.company].filter(Boolean).join(', ')}` : ''].filter(Boolean).join(' '))
		.join('; ');

/** The Markdown copy of one post: metadata, show notes and, when there is one, the transcript. */
export function episodeMarkdown(ep: AgentEpisode, body: string, transcript: TranscriptLine[]): string {
	const guests = guestLine(ep.entry);
	const meta = [
		`- Podcast: רברס עם פלטפורמה (Reversim Podcast), in Hebrew`,
		ep.episode ? `- Episode: ${ep.episode}` : '',
		`- Date: ${ep.date.toISOString().slice(0, 10)}`,
		ep.seconds ? `- Duration: ${formatTime(ep.seconds)}` : '',
		guests ? `- Guests: ${guests}` : '',
		ep.entry?.topics?.length ? `- Topics: ${ep.entry.topics.join(', ')}` : '',
		`- Page: ${ep.url}`,
		ep.audioUrl ? `- Audio: ${ep.audioUrl}` : '',
	].filter(Boolean);
	const parts = [`# ${ep.title}`, meta.join('\n')];
	if (ep.summary) parts.push(`## Summary\n\n${ep.summary}`);
	const notes = htmlToMarkdown(body);
	if (notes) parts.push(`## Show notes\n\n${notes}`);
	if (transcript.length) {
		parts.push(
			`## Transcript\n\nAutomatic transcript. It can have errors. To link to a time, add \`#t=<seconds>\` to the page URL.\n\n` +
				transcript.map((l) => `[${formatTime(l.start)}] ${l.speaker ? `${l.speaker}: ` : ''}${l.text}`).join('\n'),
		);
	}
	return parts.join('\n\n') + '\n';
}

const episodeLine = (ep: AgentEpisode) => {
	const guests = (ep.entry?.guests ?? []).map((g) => [g.name_en || g.name_he, g.company].filter(Boolean).join(', ')).join('; ');
	const note = [ep.date.toISOString().slice(0, 10), guests, ep.summary?.replace(/\s+/g, ' ').trim()].filter(Boolean).join(' · ');
	return `- [${ep.title}](${ep.markdownUrl}): ${note}`;
};

/** /llms.txt (llmstxt.org format). `full` adds every episode, for /llms-full.txt. */
export function llmsTxt(site: string, episodes: AgentEpisode[], full = false): string {
	const recent = full ? episodes : episodes.slice(0, 30);
	return `# רברס עם פלטפורמה (Reversim Podcast)

> A Hebrew-language podcast for software developers in Israel, on the air since 2009. Hosts: Ran Tavory and Ori Lahav. More than 500 episodes about software architecture, infrastructure, AI, engineering management and careers. Each episode page has a summary, show notes and links. New episodes also have chapters and a full transcript.

Notes for AI agents:

- The content is in Hebrew. Episode titles are frequently in English.
- Each episode page has a Markdown copy. Replace \`.html\` with \`.md\` in the page URL.
- To search the archive (titles, guests, companies and transcripts), use the MCP server: ${MCP_URL} (Streamable HTTP, no login, read-only). Tools: search_episodes, search_transcripts, get_episode, get_transcript, list_recent_episodes.
- When you cite an episode, give the episode title and link to its page. To link to a moment, add \`#t=<seconds>\` to the page URL.
- Transcripts are automatic and can have errors.
- The content is free to read, quote and use as input for answers. Give attribution to "רברס עם פלטפורמה" with a link.

## Machine-readable data

- [All episodes, with summaries](${site}/llms-full.txt): one line for each episode, newest first
- [Episode list as JSON](${site}/episodes.json): number, title, date and URL of each episode
- [Podcast RSS feed](https://feed.reversim.com): audio enclosures, chapters and transcripts (Podcasting 2.0 tags)
- [Sitemap](${site}/sitemap.xml)
- [MCP server card](${site}/.well-known/mcp/server-card.json)

## Pages

- [Start here](${site}/start-here.html): recommended episodes for new listeners, by topic
- [All episodes](${site}/episodes.html)
- [Guests](${site}/guests.html): each guest with their episodes
- [Companies](${site}/companies.html): each company with its episodes
- [Reversim Summit talks](${site}/summit-talks.html): conference talks by podcast guests
- [About and contact](${site}/about.html)
- [How to connect an AI assistant (MCP)](${site}/mcp.html)

## ${full ? 'All episodes' : 'Recent episodes'}

${recent.map(episodeLine).join('\n')}
${full ? '' : `\n## Optional\n\n- [Archive by year](${site}/archive.html)\n- [Reversim Summit conference](https://summit.reversim.com/)\n`}`;
}
