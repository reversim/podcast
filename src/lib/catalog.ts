// Guest, company and topic indexes, built from src/data/catalog.json (made by scripts/catalog.mjs).
import catalogJson from '../data/catalog.json';

export interface CatalogGuest {
	name_he: string;
	name_en: string;
	company: string;
	role: string;
}

export interface CatalogEntry {
	kind: string;
	guests: CatalogGuest[];
	companies: string[];
	topics: string[];
	hook: string;
	evergreen: number;
}

export interface IndexedEpisode {
	id: string;
	detail?: string; // company and role for a guest, guest names for a company
}

export interface IndexGroup {
	key: string;
	name: string;
	altName?: string;
	episodes: IndexedEpisode[];
	links?: { href: string; label: string; meta?: string }[]; // for example Summit talks of a guest
}

export const catalog = catalogJson as Record<string, CatalogEntry>;

export const TOPIC_LABELS: Record<string, string> = {
	ai: 'AI, LLMs ו-Machine Learning',
	data: 'Data Engineering ו-Analytics',
	architecture: 'ארכיטקטורה ו-Backend',
	infra: 'תשתיות, DevOps ו-Cloud',
	databases: 'מסדי נתונים ו-Storage',
	frontend: 'Frontend ו-Mobile',
	security: 'אבטחת מידע',
	languages: 'שפות תכנות וכלי פיתוח',
	quality: 'בדיקות, איכות ו-Observability',
	management: 'ניהול הנדסה ותרבות ארגונית',
	career: 'קריירה והתפתחות אישית',
	product: 'מוצר ו-Startups',
	opensource: 'קוד פתוח וקהילה',
	lowlevel: 'חומרה, מערכות הפעלה ו-Low Level',
};

const norm = (s: string) => s.toLowerCase().replace(/["'׳״.,\-–()]/g, ' ').replace(/\s+/g, ' ').trim();

/** Company names differ a little between episodes ("Wix", "Wix.com", "Wix Engineering"). */
export function companyKey(name: string): string {
	const key = norm(name.replace(/\.(com|io|ai|co)\b/gi, ''))
		.replace(/\b(inc|ltd|labs?|engineering|technologies|security)\b/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return key || norm(name); // a name that is only a generic word ("Labs") keeps its own key
}

/** One group for each guest. Guests are matched by the Hebrew name, or by the English name when both have one. */
export function buildGuestIndex(entries: Record<string, CatalogEntry>, validIds: Set<string>): IndexGroup[] {
	const groups = new Map<string, IndexGroup>();
	const byEnglish = new Map<string, string>();
	for (const [id, entry] of Object.entries(entries)) {
		if (!validIds.has(id)) continue;
		for (const g of entry.guests) {
			const he = norm(g.name_he), en = norm(g.name_en);
			if (!he && !en) continue;
			let key = he || en;
			if (en && byEnglish.has(en)) key = byEnglish.get(en) as string;
			else if (en) byEnglish.set(en, key);
			let group = groups.get(key);
			if (!group) {
				// A Hebrew first name only ("ניב") is a poor label when the full English name is known.
				const fullHe = g.name_he.trim().includes(' ');
				const name = fullHe || !g.name_en ? g.name_he || g.name_en : g.name_en;
				group = { key, name, altName: g.name_en && g.name_en !== name ? g.name_en : undefined, episodes: [] };
				groups.set(key, group);
			}
			if (!group.altName && g.name_en && g.name_en !== group.name) group.altName = g.name_en;
			if (!group.episodes.some((e) => e.id === id)) {
				group.episodes.push({ id, detail: [g.role, g.company].filter(Boolean).join(', ') || undefined });
			}
		}
	}
	return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

/** One group for each company: the companies of the guests plus the companies that the episode is about. */
export function buildCompanyIndex(entries: Record<string, CatalogEntry>, validIds: Set<string>): IndexGroup[] {
	const groups = new Map<string, IndexGroup>();
	for (const [id, entry] of Object.entries(entries)) {
		if (!validIds.has(id)) continue;
		const names = new Map<string, string>();
		for (const g of entry.guests) if (g.company) names.set(companyKey(g.company), g.company);
		for (const c of entry.companies) if (!names.has(companyKey(c))) names.set(companyKey(c), c);
		for (const [key, name] of names) {
			if (!key) continue;
			let group = groups.get(key);
			if (!group) {
				group = { key, name, episodes: [] };
				groups.set(key, group);
			}
			if (name.length < group.name.length) group.name = name; // the shortest spelling is usually the plain name
			const guests = entry.guests.filter((g) => companyKey(g.company) === key).map((g) => g.name_he || g.name_en);
			group.episodes.push({ id, detail: guests.join(', ') || undefined });
		}
	}
	return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

/** First letter for the A–Z / א–ת jump list. */
export function initial(name: string): string {
	const ch = name.trim().charAt(0).toUpperCase();
	return /[A-Zא-ת]/.test(ch) ? ch : '#';
}

export interface SummitTalk {
	year: number;
	id: string;
	title: string;
	speaker: string;
}

/** Adds the Summit talks of each guest (matched by the English name) as links to YouTube. */
export function attachSummitTalks(groups: IndexGroup[], talks: SummitTalk[]): IndexGroup[] {
	const bySpeaker = new Map<string, SummitTalk[]>();
	for (const t of talks) {
		for (const name of t.speaker.split(/ & | and |, /)) {
			const key = norm(name);
			if (!key) continue;
			bySpeaker.set(key, [...(bySpeaker.get(key) ?? []), t]);
		}
	}
	for (const g of groups) {
		const found = bySpeaker.get(norm(g.altName ?? '')) ?? bySpeaker.get(norm(g.name));
		if (found) {
			g.links = found.map((t) => ({ href: `https://www.youtube.com/watch?v=${t.id}`, label: t.title, meta: `Reversim Summit ${t.year}` }));
		}
	}
	return groups;
}
