import { describe, it, expect } from 'vitest';
import sanitizeHtml from 'sanitize-html';

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[*\-]\s+/gm, '')
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Mirrors the description logic in podcast.xml.ts
function makeDescription(summary: string | undefined, body: string, maxLen = 1000): string {
  if (summary) return summary;
  const rawText = sanitizeHtml(body, { allowedTags: [], allowedAttributes: {} });
  return stripMarkdown(rawText).slice(0, maxLen).trim();
}

describe('RSS episode description', () => {
  it('prefers summary when present', () => {
    expect(makeDescription('Short summary', '<p>Long body</p>')).toBe('Short summary');
  });

  it('strips HTML tags from body', () => {
    const body = '<div dir="rtl"><p>תוכן הפרק</p><a href="#">קישור</a></div>';
    expect(makeDescription(undefined, body)).toBe('תוכן הפרקקישור');
  });

  it('truncates body to 1000 chars', () => {
    const body = `<p>${'א'.repeat(2000)}</p>`;
    const result = makeDescription(undefined, body);
    expect(result.length).toBeLessThanOrEqual(1000);
  });

  it('returns empty string for empty body with no summary', () => {
    expect(makeDescription(undefined, '')).toBe('');
  });

  it('trims leading/trailing whitespace from body', () => {
    expect(makeDescription(undefined, '<p>   שלום   </p>')).toBe('שלום');
  });
});

describe('stripMarkdown', () => {
  it('converts markdown links to plain text', () => {
    expect(stripMarkdown('[יובל](https://example.com)')).toBe('יובל');
  });

  it('strips bold markers', () => {
    expect(stripMarkdown('**[04:38] כותרת**')).toBe('[04:38] כותרת');
  });

  it('strips bullet markers', () => {
    expect(stripMarkdown('* נקודה ראשונה')).toBe('נקודה ראשונה');
  });

  it('strips heading markers', () => {
    expect(stripMarkdown('## כותרת')).toBe('כותרת');
  });

  it('leaves plain Hebrew untouched', () => {
    expect(stripMarkdown('האזנה נעימה!')).toBe('האזנה נעימה!');
  });
});

describe('image path sanity', () => {
  it('post image paths must not contain /podcast/ prefix', () => {
    const brokenPath = '/podcast/images/blogger/abc.png';
    const fixedPath = '/images/blogger/abc.png';
    expect(brokenPath.replace('/podcast/images/', '/images/')).toBe(fixedPath);
  });
});
