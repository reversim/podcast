// Helpers for episode metadata: chapters, transcripts, plain-text descriptions.
// Pure functions only (no Astro imports), so vitest can test them.

export interface Chapter {
	startTime: number; // seconds
	title: string;
}

export interface TranscriptLine {
	start: number; // seconds
	speaker: string;
	text: string;
}

/** "MM:SS" or "H:MM:SS" → seconds. Returns NaN for bad input. */
export function parseTime(stamp: string): number {
	const parts = stamp.trim().split(':').map((p) => Number(p));
	if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p) || p < 0)) return NaN;
	return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** seconds → "MM:SS" (or "H:MM:SS" from one hour). */
export function formatTime(seconds: number): string {
	const s = Math.max(0, Math.floor(seconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const pad = (n: number) => String(n).padStart(2, '0');
	return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

/** seconds → "HH:MM:SS" as itunes:duration wants it. */
export function formatDuration(seconds: number): string {
	const s = Math.max(0, Math.round(seconds));
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

const CHAPTER_LINE = /^\*\*\[(\d{1,2}(?::\d{2}){1,2})\]\s*(.+?)\*\*\s*$/;

/** Chapters are the bold "**[MM:SS] Title**" lines that the post generator writes. */
export function parseChapters(body: string): Chapter[] {
	const chapters: Chapter[] = [];
	for (const line of body.split('\n')) {
		const m = CHAPTER_LINE.exec(line.trim());
		if (!m) continue;
		const startTime = parseTime(m[1]);
		const title = m[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
		if (Number.isFinite(startTime) && title) chapters.push({ startTime, title });
	}
	// A chapter list that does not increase is a sign of bad timestamps: do not publish it.
	for (let i = 1; i < chapters.length; i++) {
		if (chapters[i].startTime <= chapters[i - 1].startTime) return [];
	}
	if (chapters.length < 2) return [];
	// Players want the first chapter to start at 0.
	if (chapters[0].startTime > 0) chapters.unshift({ startTime: 0, title: 'פתיחה' });
	return chapters;
}

/** Podcasting 2.0 JSON chapters document. */
export function chaptersJson(chapters: Chapter[]) {
	return { version: '1.2.0', chapters };
}

const TRANSCRIPT_LINE = /^\[(\d{1,3}(?::\d{2}){1,2})\]\s*(?:\*\*(.+?)\*\*\s*:?|([^:]{1,40}):)?\s*(.*)$/;

/** Transcript lines look like "[MM:SS] **Speaker**: text". Lines without a timestamp continue the previous line. */
export function parseTranscript(raw: string): TranscriptLine[] {
	const lines: TranscriptLine[] = [];
	for (const rawLine of raw.split('\n')) {
		const line = rawLine.trim();
		if (!line) continue;
		const m = TRANSCRIPT_LINE.exec(line);
		if (!m) {
			if (lines.length) lines[lines.length - 1].text += ' ' + line;
			continue;
		}
		const start = parseTime(m[1]);
		if (!Number.isFinite(start)) continue;
		const speaker = (m[2] ?? m[3] ?? '').replace(/:$/, '').trim();
		const text = m[4].trim();
		if (!text) continue;
		lines.push({ start, speaker, text });
	}
	return lines;
}

function vttTime(seconds: number): string {
	const ms = Math.max(0, Math.round(seconds * 1000));
	const pad = (n: number, w = 2) => String(n).padStart(w, '0');
	return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}.${pad(ms % 1000, 3)}`;
}

/** WebVTT with speaker voice tags. A cue ends where the next one starts (maximum 30 s). */
export function transcriptToVtt(lines: TranscriptLine[], duration?: number): string {
	const out = ['WEBVTT', ''];
	lines.forEach((line, i) => {
		const next = lines[i + 1]?.start ?? duration ?? line.start + 10;
		const end = Math.min(Math.max(next, line.start + 1), line.start + 30);
		const text = line.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const speaker = line.speaker.replace(/[<>&.\s]+/g, ' ').trim();
		out.push(`${vttTime(line.start)} --> ${vttTime(end)}`);
		out.push(speaker ? `<v ${speaker}>${text}` : text);
		out.push('');
	});
	return out.join('\n');
}

/** First plain-text sentences of a Markdown or HTML body, for meta descriptions. */
export function plainDescription(body: string, max = 200): string {
	const text = body
		.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/[*_`#>]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export function xmlEscape(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Cuts HTML at `max` characters or less: not in a tag, not in an entity, and at a word boundary when possible. */
export function cutHtml(html: string, max: number): string {
	if (html.length <= max) return html;
	let cut = html.slice(0, max);
	// Do not stop in the middle of a tag or an entity.
	if (cut.lastIndexOf('<') > cut.lastIndexOf('>')) cut = cut.slice(0, cut.lastIndexOf('<'));
	const amp = cut.lastIndexOf('&');
	if (amp > cut.length - 10 && !cut.slice(amp).includes(';')) cut = cut.slice(0, amp);
	// Go back to the last space, if the text after the last tag has one.
	const space = cut.lastIndexOf(' ');
	if (space > cut.lastIndexOf('>')) cut = cut.slice(0, space);
	return cut.trimEnd();
}
