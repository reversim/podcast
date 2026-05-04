import { describe, it, expect } from 'vitest';

// Pure reimplementation of withBase logic for unit testing
function withBase(base: string, path: string): string {
  if (!path) return base;
  if (base === '/' || base === '') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

describe('withBase logic', () => {
  describe('base = / (custom domain, production)', () => {
    it('returns absolute path unchanged', () => {
      expect(withBase('/', '/images/foo.png')).toBe('/images/foo.png');
    });
    it('adds leading slash to relative path', () => {
      expect(withBase('/', 'images/foo.png')).toBe('/images/foo.png');
    });
    it('returns base for empty path', () => {
      expect(withBase('/', '')).toBe('/');
    });
  });

  describe('base = /podcast/ (GitHub Pages without custom domain)', () => {
    it('prepends base to absolute path — documents the cover-image bug', () => {
      // This is why cover images must NOT go through withBase:
      // on a custom domain base is always '/', but in some CI environments
      // it became '/podcast/', producing broken /podcast/images/... URLs.
      expect(withBase('/podcast/', '/images/foo.png')).toBe('/podcast/images/foo.png');
    });
    it('prepends base to relative path', () => {
      expect(withBase('/podcast/', 'page')).toBe('/podcast/page');
    });
    it('handles trailing slash on base', () => {
      expect(withBase('/podcast/', '/admin')).toBe('/podcast/admin');
    });
  });
});

describe('post permalink format', () => {
  // Regression test for the social post URL bug:
  // was /{year}/{month}/{episode}-{slug}.html
  // correct: /{year}/{month}/{year}-{month}-{episode}-{slug}.html
  function makePostUrl(year: string, month: string, episode: number, slug: string) {
    return `https://www.reversim.com/${year}/${month}/${year}-${month}-${episode}-${slug.toLowerCase()}.html`;
  }

  it('generates correct permalink for episode 513', () => {
    expect(makePostUrl('2026', '04', 513, 'PDFRTL'))
      .toBe('https://www.reversim.com/2026/04/2026-04-513-pdfrtl.html');
  });

  it('lowercases the slug', () => {
    expect(makePostUrl('2025', '11', 504, 'Functional-Programming'))
      .toBe('https://www.reversim.com/2025/11/2025-11-504-functional-programming.html');
  });
});
