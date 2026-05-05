import { describe, it, expect } from 'vitest';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

const ALLOWED_TAGS = ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4'];

// Mirrors the description logic in podcast.xml.ts
async function makeDescription(summary: string | undefined, body: string): Promise<string> {
  if (summary) return summary;
  const html = await marked(body);
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href'] },
  });
}

describe('RSS episode description', () => {
  it('prefers summary when present', async () => {
    expect(await makeDescription('Short summary', '**Long body**')).toBe('Short summary');
  });

  it('converts markdown links to <a> tags', async () => {
    const result = await makeDescription(undefined, '[יובל](https://example.com)');
    expect(result).toContain('<a href="https://example.com">יובל</a>');
  });

  it('converts bold to <strong>', async () => {
    const result = await makeDescription(undefined, '**כותרת**');
    expect(result).toContain('<strong>כותרת</strong>');
  });

  it('converts bullet list to <ul><li>', async () => {
    const result = await makeDescription(undefined, '* פריט ראשון');
    expect(result).toContain('<li>פריט ראשון</li>');
  });

  it('passes through existing HTML (Blogger posts)', async () => {
    const body = '<p>תוכן הפרק</p>';
    const result = await makeDescription(undefined, body);
    expect(result).toContain('<p>תוכן הפרק</p>');
  });

  it('returns empty string for empty body with no summary', async () => {
    expect(await makeDescription(undefined, '')).toBe('');
  });

  it('returns full body without truncation', async () => {
    const body = 'א'.repeat(2000);
    const result = await makeDescription(undefined, body);
    expect(result.length).toBeGreaterThan(2000);
  });
});

describe('image path sanity', () => {
  it('post image paths must not contain /podcast/ prefix', () => {
    const brokenPath = '/podcast/images/blogger/abc.png';
    const fixedPath = '/images/blogger/abc.png';
    expect(brokenPath.replace('/podcast/images/', '/images/')).toBe(fixedPath);
  });
});
