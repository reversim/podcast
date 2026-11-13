// Related episodes: same guest first, then same company, then shared topics. Pure function, tested with vitest.
import { companyKey, type CatalogEntry } from './catalog';

export interface RelatedCandidate {
	id: string;
	time: number; // publish time in ms
}

const guestKeys = (e: CatalogEntry) => e.guests.map((g) => (g.name_he || g.name_en).toLowerCase().trim()).filter(Boolean);
const companyKeys = (e: CatalogEntry) => [...e.guests.map((g) => g.company), ...e.companies].map(companyKey).filter(Boolean);

export function relatedEpisodes(id: string, candidates: RelatedCandidate[], catalog: Record<string, CatalogEntry>, count = 4): string[] {
	const me = catalog[id];
	if (!me) return [];
	const myGuests = new Set(guestKeys(me)), myCompanies = new Set(companyKeys(me)), myTopics = new Set(me.topics);
	const myTime = candidates.find((c) => c.id === id)?.time ?? Date.now();
	const scored: { id: string; score: number; time: number }[] = [];
	for (const c of candidates) {
		const other = catalog[c.id];
		if (!other || c.id === id) continue;
		// Summit recordings are related only to other Summit recordings.
		if ((other.kind === 'summit') !== (me.kind === 'summit')) continue;
		let score = 0;
		if (guestKeys(other).some((g) => myGuests.has(g))) score += 6;
		if (companyKeys(other).some((k) => myCompanies.has(k))) score += 3;
		const shared = other.topics.filter((t) => myTopics.has(t)).length;
		score += shared * 1.5;
		if (shared === 0 && score === 0) continue;
		if (other.kind === me.kind) score += 0.5;
		score += (other.evergreen - 3) * 0.3;
		// Episodes from the same period are closer in subject (same tools, same trends): up to 1 point within 3 years.
		const years = Math.abs(c.time - myTime) / (365 * 86400000);
		score += Math.max(0, 1 - years / 3);
		scored.push({ id: c.id, score, time: c.time });
	}
	return scored.sort((a, b) => b.score - a.score || b.time - a.time).slice(0, count).map((s) => s.id);
}
