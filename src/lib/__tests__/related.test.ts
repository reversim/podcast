import { describe, it, expect } from 'vitest';
import { relatedEpisodes } from '../related';
import type { CatalogEntry } from '../catalog';

const e = (p: Partial<CatalogEntry>): CatalogEntry => ({ kind: 'interview', guests: [], companies: [], topics: [], hook: '', evergreen: 3, ...p });
const guest = (name: string, company = '') => ({ name_he: name, name_en: '', company, role: '' });
const day = 86400000;

describe('relatedEpisodes', () => {
	const catalog = {
		me: e({ guests: [guest('דנה', 'Wix')], topics: ['ai', 'data'] }),
		sameGuest: e({ guests: [guest('דנה', 'Other')], topics: ['career'] }),
		sameCompany: e({ companies: ['Wix.com'], topics: ['frontend'] }),
		twoTopics: e({ topics: ['ai', 'data'] }),
		oneTopic: e({ topics: ['ai'] }),
		nothing: e({ topics: ['security'] }),
		summit: e({ kind: 'summit', topics: ['ai', 'data'] }),
	};
	const candidates = Object.keys(catalog).map((id, i) => ({ id, time: 1e12 + i * day }));
	it('orders by guest, then company, then topics, and leaves out unrelated and Summit items', () => {
		expect(relatedEpisodes('me', candidates, catalog, 10)).toEqual(['sameGuest', 'sameCompany', 'twoTopics', 'oneTopic']);
	});
	it('respects the count and unknown ids', () => {
		expect(relatedEpisodes('me', candidates, catalog, 2)).toHaveLength(2);
		expect(relatedEpisodes('missing', candidates, catalog)).toEqual([]);
	});
});
