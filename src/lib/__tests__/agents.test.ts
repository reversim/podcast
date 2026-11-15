import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { htmlToMarkdown, episodeMarkdown, llmsTxt, MCP_URL, type AgentEpisode } from '../agents';
import { serverCard } from '../../../mcp/src/index';

const ep: AgentEpisode = {
	id: '2026-11-522-x',
	title: '522 - Company brain',
	date: new Date('2026-11-10T00:00:00Z'),
	episode: 522,
	audioUrl: 'https://m2.reversim.com/reversim522.mp3',
	url: 'https://www.reversim.com/2026/11/2026-11-522-x.html',
	markdownUrl: 'https://www.reversim.com/2026/11/2026-11-522-x.md',
	summary: 'תקציר',
	entry: { kind: 'interview', guests: [{ name_he: 'שמוליק', name_en: 'Shmulik', company: 'Lusha', role: 'Architect' }], companies: ['Lusha'], topics: ['ai'], hook: 'x', evergreen: 4 } as never,
	seconds: 3725,
};

describe('agent output', () => {
	it('converts Blogger HTML to Markdown', () => {
		const md = htmlToMarkdown('<div dir="rtl"><p>a</p><p>b</p><br><h3>Title</h3><ul><li>One <a href="https://a.b/c">link</a></li><li><b>Two</b></li></ul><script>x()</script><iframe src="y"></iframe><a href="/img.png"><img src="/img.png"></a></div>');
		expect(md).toContain('### Title');
		expect(md).toContain('- One [link](https://a.b/c)');
		expect(md).toContain('- **Two**');
		expect(md).not.toMatch(/x\(\)|iframe|img\.png|<\w/);
		expect(htmlToMarkdown('**[01:51] Part**\n\n* item\n* item 2')).toBe('**[01:51] Part**\n\n* item\n* item 2');
	});
	it('writes the Markdown copy of an episode with metadata and transcript', () => {
		const md = episodeMarkdown(ep, 'Notes', [{ start: 75, speaker: 'רן', text: 'שלום' }]);
		expect(md.startsWith('# 522 - Company brain\n')).toBe(true);
		expect(md).toContain('- Episode: 522');
		expect(md).toContain('- Duration: 1:02:05');
		expect(md).toContain('- Guests: Shmulik (שמוליק) — Architect, Lusha');
		expect(md).toContain('## Show notes\n\nNotes');
		expect(md).toContain('[01:15] רן: שלום');
		expect(episodeMarkdown(ep, '', [])).not.toContain('## Transcript');
	});
	it('writes llms.txt in the llmstxt.org format', () => {
		const many = Array.from({ length: 40 }, () => ep);
		const txt = llmsTxt('https://www.reversim.com', many);
		expect(txt.startsWith('# ')).toBe(true);
		expect(txt).toMatch(/\n> /);
		expect(txt).toContain(MCP_URL);
		expect(txt.match(/2026-11-522-x\.md/g)).toHaveLength(30);
		expect(llmsTxt('https://www.reversim.com', many, true).match(/2026-11-522-x\.md/g)).toHaveLength(40);
	});
	it('keeps the static MCP server card equal to the card of the Worker', () => {
		const expected = JSON.parse(JSON.stringify(serverCard('https://mcp.reversim.com', 'https://www.reversim.com')));
		for (const file of ['public/.well-known/mcp/server-card.json', 'public/.well-known/mcp.json']) {
			expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(expected);
		}
	});
});
