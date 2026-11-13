import { describe, it, expect } from 'vitest';
import { ftsQuery, handleRpc } from '../../../mcp/src/index';
// @ts-expect-error plain .mjs script without types
import { toPassages } from '../../../scripts/mcp-export.mjs';

describe('MCP server', () => {
	it('builds a safe FTS query', () => {
		expect(ftsQuery('Vendor Lock-in')).toBe('"Vendor" AND "Lock-in"');
		expect(ftsQuery('מוח ארגוני של AI')).toBe('"מוח" AND "ארגוני"');
		expect(ftsQuery('a" OR (x) *')).toBeNull();
		expect(ftsQuery('kafka" OR "1')).toBe('"kafka"');
	});
	it('answers the handshake and the tool list with no database', async () => {
		const env = {} as never;
		const init = (await handleRpc(env, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })) as { result: { capabilities: unknown } };
		expect(init.result.capabilities).toEqual({ tools: {} });
		const list = (await handleRpc(env, { jsonrpc: '2.0', id: 2, method: 'tools/list' })) as { result: { tools: { name: string }[] } };
		expect(list.result.tools.map((t) => t.name)).toContain('search_transcripts');
		expect(await handleRpc(env, { jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
		const bad = (await handleRpc(env, { jsonrpc: '2.0', id: 3, method: 'nope' })) as { error: { code: number } };
		expect(bad.error.code).toBe(-32601);
	});
	it('returns a tool error as a result, not as a protocol error', async () => {
		const r = (await handleRpc({} as never, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'search_episodes', arguments: { query: 'ab' } } })) as { result: { isError: boolean } };
		expect(r.result.isError).toBe(true);
	});
});

describe('transcript passages', () => {
	it('groups lines into passages of about one minute', () => {
		const long = 'מילה '.repeat(100).trim();
		const raw = `[00:00] **רן**: שלום\n[00:05] **אורי**: היי\n[01:10] **רן**: ${long}\n[02:00] **אורי**: ${long}\nno timestamp`;
		const p = toPassages(raw);
		expect(p).toHaveLength(2);
		expect(p[0]).toEqual({ start: 0, text: `רן: שלום\nאורי: היי\nרן: ${long}` });
		expect(p[1].start).toBe(120);
	});
});
