import { describe, expect, it, vi } from 'vitest';
import { handlePlatform, originOk, rowError, validateBody } from '../src/platform';
import { buildStats } from '../src/stats';
import type { Env } from '../src/env';

const NOW = Date.UTC(2026, 10, 11, 12); // 2026-11-11
const row = (o: Record<string, unknown> = {}) => ({ day: '2026-11-10', platform: 'spotify', metric: 'followers', value: 1234, ...o });

describe('rowError', () => {
  it('accepts a good row and edge values', () => {
    expect(rowError(row(), NOW)).toBeNull();
    expect(rowError(row({ day: '2008-01-01', value: 0 }), NOW)).toBeNull();
    expect(rowError(row({ day: '2026-11-12' }), NOW)).toBeNull(); // +1 day tolerance
    expect(rowError(row({ value: 12.5, metric: 'engaged_listeners' }), NOW)).toBeNull();
  });
  it.each([
    ['not an object', null], ['array', []],
    ['bad day format', row({ day: '2026-1-1' })], ['fake date', row({ day: '2026-02-30' })],
    ['too old', row({ day: '2007-12-31' })], ['future', row({ day: '2026-11-13' })], ['day number', row({ day: 20261110 })],
    ['bad platform', row({ platform: 'tiktok' })], ['upper metric', row({ metric: 'Followers' })],
    ['empty metric', row({ metric: '' })], ['long metric', row({ metric: 'a'.repeat(41) })],
    ['negative', row({ value: -1 })], ['huge', row({ value: 1e12 })], ['NaN', row({ value: NaN })],
    ['string value', row({ value: '5' })], ['null value', row({ value: null })],
  ])('rejects %s', (_n, r) => { expect(rowError(r, NOW)).toEqual(expect.any(String)); });
});

describe('validateBody', () => {
  it('reports the first bad row index', () => {
    expect(validateBody({ rows: [row(), row({ value: -1 }), row()] }, NOW)).toMatchObject({ row: 1 });
  });
  it('rejects empty, missing and too many rows', () => {
    expect(validateBody({ rows: [] }, NOW)).toHaveProperty('error');
    expect(validateBody({}, NOW)).toHaveProperty('error');
    expect(validateBody({ rows: new Array(5001).fill(row()) }, NOW)).toHaveProperty('error');
    expect(validateBody({ rows: new Array(5000).fill(row()) }, NOW)).toHaveProperty('rows');
  });
  it('drops extra fields', () => {
    const v = validateBody({ rows: [{ ...row(), evil: 1 }] }, NOW);
    expect(v).toEqual({ rows: [row()] });
  });
});

const env = (o: Partial<Env> = {}, db: unknown = {}) => ({ STATS_HOST: 'stats.reversim.com', DB: db, ...o }) as unknown as Env;
const post = (body: unknown, h: Record<string, string> = {}) => new Request('https://stats.reversim.com/api/platform', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: { 'content-type': 'application/json', origin: 'https://stats.reversim.com', ...h },
});

describe('originOk', () => {
  it('requires the exact stats origin', () => {
    expect(originOk(post({}), env())).toBe(true);
    expect(originOk(post({}, { origin: 'https://evil.com' }), env())).toBe(false);
    expect(originOk(post({}, { origin: 'https://stats.reversim.com.evil.com' }), env())).toBe(false);
    expect(originOk(post({}, { origin: 'null' }), env())).toBe(false);
    const noOrigin = new Request('https://stats.reversim.com/api/platform', { method: 'POST' });
    expect(originOk(noOrigin, env())).toBe(false);
  });
  it('uses x-dev-host only when DEV=1', () => {
    const r = new Request('http://localhost:8787/api/platform', { method: 'POST', headers: { origin: 'https://stats.reversim.com', 'x-dev-host': 'stats.reversim.com' } });
    expect(originOk(r, env({ DEV: '1' }))).toBe(true);
    expect(originOk(r, env())).toBe(true); // matches STATS_HOST either way
    const r2 = new Request('http://localhost:8787/api/platform', { method: 'POST', headers: { origin: 'http://localhost:8787' } });
    expect(originOk(r2, env({ DEV: '1' }))).toBe(true);
    expect(originOk(r2, env())).toBe(false);
  });
});

function stubDb(changes = 0) {
  const batches: unknown[][][] = [];
  const runs: { sql: string; args: unknown[] }[] = [];
  const DB = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({ sql, args, run: async () => { runs.push({ sql, args }); return { meta: { changes } }; } }),
    }),
    batch: async (s: { args: unknown[] }[]) => { batches.push(s.map((x) => x.args)); return []; },
  };
  return { DB, batches, runs };
}

describe('handlePlatform POST', () => {
  it('upserts rows in chunks of at most 50', async () => {
    const { DB, batches } = stubDb();
    const rows = Array.from({ length: 120 }, (_, i) => row({ value: i }));
    const res = await handlePlatform(post({ rows }), env({}, DB), NOW);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, rows: 120 });
    expect(batches.map((b) => b.length)).toEqual([50, 50, 20]);
    expect(batches[0][0]).toEqual(['spotify', 'followers', '2026-11-10', 0]);
  });
  it('returns 400 with the row index and writes nothing on an invalid row', async () => {
    const { DB, batches } = stubDb();
    const res = await handlePlatform(post({ rows: [row(), row({ platform: 'x' })] }), env({}, DB), NOW);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ row: 1, error: expect.stringContaining('platform') });
    expect(batches).toHaveLength(0);
  });
  it('rejects bad JSON, big bodies, wrong content type and bad origin', async () => {
    const { DB, batches } = stubDb();
    expect((await handlePlatform(post('{nope'), env({}, DB), NOW)).status).toBe(400);
    const big = JSON.stringify({ rows: [row()], pad: 'x'.repeat(600 * 1024) });
    expect((await handlePlatform(post(big), env({}, DB), NOW)).status).toBe(413);
    expect((await handlePlatform(post({ rows: [row()] }, { 'content-type': 'text/plain' }), env({}, DB), NOW)).status).toBe(403);
    expect((await handlePlatform(post({ rows: [row()] }, { 'content-type': 'application/x-www-form-urlencoded' }), env({}, DB), NOW)).status).toBe(403);
    expect((await handlePlatform(post({ rows: [row()] }, { origin: 'https://evil.com' }), env({}, DB), NOW)).status).toBe(403);
    expect(batches).toHaveLength(0);
  });
  it('answers 500 JSON when the database fails', async () => {
    const DB = { prepare: () => ({ bind: () => ({}) }), batch: async () => { throw new Error('boom'); } };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await handlePlatform(post({ rows: [row()] }), env({}, DB), NOW);
    expect(res.status).toBe(500);
    expect(await res.json()).toHaveProperty('error');
  });
  it('rejects other methods', async () => {
    const r = new Request('https://stats.reversim.com/api/platform');
    expect((await handlePlatform(r, env(), NOW)).status).toBe(405);
  });
});

describe('handlePlatform DELETE', () => {
  const del = (qs: string, h: Record<string, string> = { origin: 'https://stats.reversim.com' }) =>
    new Request('https://stats.reversim.com/api/platform?' + qs, { method: 'DELETE', headers: h });
  it('deletes a series and reports the count', async () => {
    const { DB, runs } = stubDb(7);
    const res = await handlePlatform(del('platform=spotify&metric=followers'), env({}, DB));
    expect(await res.json()).toEqual({ ok: true, deleted: 7 });
    expect(runs[0].args).toEqual(['spotify', 'followers']);
    expect(runs[0].sql).not.toContain('day = ?3');
  });
  it('deletes one point', async () => {
    const { DB, runs } = stubDb(1);
    const res = await handlePlatform(del('platform=apple&metric=listeners&day=2026-11-01'), env({}, DB));
    expect(await res.json()).toEqual({ ok: true, deleted: 1 });
    expect(runs[0].args).toEqual(['apple', 'listeners', '2026-11-01']);
  });
  it('validates input and origin', async () => {
    const { DB, runs } = stubDb();
    expect((await handlePlatform(del('platform=zzz&metric=followers'), env({}, DB))).status).toBe(400);
    expect((await handlePlatform(del('platform=apple&metric=BAD'), env({}, DB))).status).toBe(400);
    expect((await handlePlatform(del('platform=apple&metric=a&day=2026-02-31'), env({}, DB))).status).toBe(400);
    expect((await handlePlatform(del('platform=apple&metric=a', {}), env({}, DB))).status).toBe(403);
    expect(runs).toHaveLength(0);
  });
});

describe('platforms block in buildStats', () => {
  const mk = (platformFails: boolean) => {
    const series = [{ platform: 'spotify', metric: 'followers', day: '2026-11-01', value: 10 }];
    const latest = [{ platform: 'spotify', metric: 'followers', day: '2026-11-01', value: 10, prev_day: null, prev_value: null }];
    return {
      prepare: (sql: string) => ({
        bind: () => ({ all: async () => ({ results: [] }) }),
        all: async () => {
          if (!sql.includes('platform_stats')) return { results: [] };
          if (platformFails) throw new Error('no such table: platform_stats');
          return { results: sql.includes('ROW_NUMBER') ? latest : series };
        },
      }),
    };
  };
  it('has series and latest', async () => {
    const out = await buildStats(env({}, mk(false)), 30, NOW);
    expect(out.platforms.series).toHaveLength(1);
    expect(out.platforms.latest[0]).toMatchObject({ prev_day: null, prev_value: null });
    expect(out).toHaveProperty('web');
    expect(out).toHaveProperty('feed');
  });
  it('is empty when the table is missing, rest still works', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const out = await buildStats(env({}, mk(true)), 30, NOW);
    expect(out.platforms).toEqual({ series: [], latest: [] });
    expect(out.range.to).toBe('2026-11-11');
  });
});
