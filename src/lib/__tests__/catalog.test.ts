import { describe, it, expect } from 'vitest';
import { attachSummitTalks, buildCompanyIndex, buildGuestIndex, companyKey, type CatalogEntry } from '../catalog';

const entry = (guests: CatalogEntry['guests'], companies: string[] = []): CatalogEntry => ({ kind: 'interview', guests, companies, topics: [], hook: '', evergreen: 3 });
const entries = {
	a: entry([{ name_he: 'דנה כהן', name_en: 'Dana Cohen', company: 'Wix', role: 'CTO' }]),
	b: entry([{ name_he: 'דנה כהן', name_en: '', company: 'Wix.com', role: '' }], ['Wix Engineering']),
	c: entry([{ name_he: 'ניב', name_en: 'Niv Vosco', company: 'Hailo', role: '' }]),
	hidden: entry([{ name_he: 'לא קיים', name_en: '', company: 'X', role: '' }]),
};
const ids = new Set(['a', 'b', 'c']);

describe('catalog indexes', () => {
	it('merges a guest across episodes and skips unknown posts', () => {
		const groups = buildGuestIndex(entries, ids);
		expect(groups.map((g) => g.name).sort()).toEqual(['Niv Vosco', 'דנה כהן']);
		const dana = groups.find((g) => g.name === 'דנה כהן')!;
		expect(dana.episodes.map((e) => e.id)).toEqual(['a', 'b']);
		expect(dana.altName).toBe('Dana Cohen');
	});
	it('merges company spellings', () => {
		expect(companyKey('Wix.com')).toBe(companyKey('Wix Engineering'));
		const wix = buildCompanyIndex(entries, ids).find((g) => g.key === 'wix')!;
		expect(wix.name).toBe('Wix');
		expect(wix.episodes).toHaveLength(2);
	});
	it('attaches Summit talks by the English name', () => {
		const groups = attachSummitTalks(buildGuestIndex(entries, ids), [
			{ year: 2019, id: 'x1', title: 'T', speaker: 'Dana Cohen & Someone Else' },
			{ year: 2022, id: 'x2', title: 'U', speaker: 'Niv Vosco' },
		]);
		expect(groups.find((g) => g.name === 'דנה כהן')!.links?.[0].href).toContain('x1');
		expect(groups.find((g) => g.name === 'Niv Vosco')!.links?.[0].meta).toBe('Reversim Summit 2022');
	});
});
