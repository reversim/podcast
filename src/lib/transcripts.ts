// Transcripts live in /transcripts/<post id>.md at the repo root (one file per episode).
// They stay out of the content collection because they are large and need no frontmatter.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTranscript, type TranscriptLine } from './episode';

const DIR = join(process.cwd(), 'transcripts');
const cache = new Map<string, TranscriptLine[]>();

export function getTranscript(postId: string): TranscriptLine[] {
	let lines = cache.get(postId);
	if (!lines) {
		const file = join(DIR, `${postId}.md`);
		lines = existsSync(file) ? parseTranscript(readFileSync(file, 'utf8')) : [];
		cache.set(postId, lines);
	}
	return lines;
}
