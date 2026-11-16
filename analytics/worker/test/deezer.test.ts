// @ts-nocheck
// Reply shape read from the live API on 2026-11-16: {"id":1003759371,"title":"...","fans":0,...}
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fansOf, fetchDeezer, runDailyDeezer } from '../src/deezer';

const T1 = Date.UTC(2026, 10, 16, 5, 7);
function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const stmt = (q, args = []) => ({
    q, args, bind: (...a) => stmt(q, a),
    first: async () => sql.prepare(q).get(...args) ?? null,
    run: async () => ({ meta: { changes: Number(sql.prepare(q).run(...args).changes) } }),
  });
  return { sql, DB: { prepare: (q) => stmt(q), batch: async (s) => { for (const x of s) sql.prepare(x.q).run(...x.args); return []; } } };
}
const envOf = (DB, o = {}) => ({ DB, DEEZER_SHOW_ID: '1003759371', ...o });
const rows = (sql) => sql.prepare(`SELECT platform, metric, day, value FROM platform_stats`).all();
afterEach(() => vi.unstubAllGlobals());

describe('deezer', () => {
  it('reads the fan count', () => {
    expect(fansOf({ fans: 12 })).toBe(12);
    expect(fansOf({ fans: 0 })).toBe(0);
    expect(fansOf({ error: { message: 'no data' } })).toBe(null);
  });
  it('stores the fan count once per day', async () => {
    const { sql, DB } = makeDb();
    const f = vi.fn(async () => Response.json({ id: 1003759371, fans: 12 }));
    vi.stubGlobal('fetch', f);
    await runDailyDeezer(envOf(DB), Date.UTC(2026, 10, 16, 4, 7));
    expect(f).toHaveBeenCalledTimes(0);
    await runDailyDeezer(envOf(DB), T1);
    await runDailyDeezer(envOf(DB), T1 + 3600000);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe('https://api.deezer.com/podcast/1003759371');
    expect(rows(sql)).toEqual([{ platform: 'deezer', metric: 'followers', day: '2026-11-16', value: 12 }]);
  });
  it('an API error is a failure, is recorded, and is tried again at most 4 times a day', async () => {
    const { sql, DB } = makeDb();
    const f = vi.fn(async () => Response.json({ error: { type: 'DataException', message: 'no data', code: 800 } }));
    vi.stubGlobal('fetch', f);
    expect((await fetchDeezer(envOf(DB), T1)).ok).toBe(false);
    for (let h = 0; h < 8; h++) await runDailyDeezer(envOf(DB), T1 + h * 3600000);
    expect(f).toHaveBeenCalledTimes(5);
    expect(rows(sql)).toEqual([]);
    expect(sql.prepare(`SELECT value FROM meta WHERE key = 'deezer_last_error'`).get().value).toContain('no data');
  });
  it('is off without the show id, and never throws on a network error', async () => {
    const { DB } = makeDb();
    const f = vi.fn(async () => { throw new Error('boom'); });
    vi.stubGlobal('fetch', f);
    await runDailyDeezer(envOf(DB, { DEEZER_SHOW_ID: undefined }), T1);
    expect(f).toHaveBeenCalledTimes(0);
    expect(await fetchDeezer(envOf(DB), T1)).toEqual({ ok: false, error: 'boom' });
  });
});
