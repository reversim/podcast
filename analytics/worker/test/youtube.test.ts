// @ts-nocheck
// Reply shapes read from the live API on 2026-11-17 (playlistItems: contentDetails.videoId, status.privacyStatus;
// videos: statistics.viewCount as a string; a private video is absent from the videos reply).
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchYoutube, runDailyYoutube, viewsOf } from '../src/youtube';

const T1 = Date.UTC(2026, 10, 17, 6, 7);
const KEY = 'AIzaSECRETKEY0123456789';
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
const envOf = (DB, o = {}) => ({ DB, YOUTUBE_PLAYLIST_ID: 'PLPrpPQF5fJrM', YOUTUBE_API_KEY: KEY, ...o });
const rows = (sql) => sql.prepare(`SELECT metric, day, value FROM platform_stats WHERE platform = 'youtube' ORDER BY metric`).all();
const item = (id, privacy) => ({ contentDetails: { videoId: id }, status: { privacyStatus: privacy } });
/** Two playlist pages (2 public + 1 private, then 1 public), and view counts 1, 3 and 10. */
function api() {
  return vi.fn(async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith('/playlistItems')) {
      return u.searchParams.get('pageToken')
        ? Response.json({ items: [item('c', 'public')] })
        : Response.json({ items: [item('a', 'public'), item('b', 'public'), item('p', 'private')], nextPageToken: 'T2' });
    }
    const views = { a: '1', b: '3', c: '10' };
    return Response.json({ items: u.searchParams.get('id').split(',').map((id) => ({ id, statistics: { viewCount: views[id] } })) });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe('youtube', () => {
  it('sums the view counts', () => {
    expect(viewsOf({ items: [{ statistics: { viewCount: '1' } }, { statistics: { viewCount: '3' } }, { statistics: {} }] })).toBe(4);
    expect(viewsOf({})).toBe(0);
  });
  it('stores views and video counts once per day, and reads all pages', async () => {
    const { sql, DB } = makeDb();
    const f = api();
    vi.stubGlobal('fetch', f);
    await runDailyYoutube(envOf(DB), T1 - 3600000);
    expect(f).toHaveBeenCalledTimes(0);
    await runDailyYoutube(envOf(DB), T1);
    await runDailyYoutube(envOf(DB), T1 + 3600000);
    expect(f).toHaveBeenCalledTimes(3);
    expect(new URL(f.mock.calls[2][0]).searchParams.get('id')).toBe('a,b,c');
    expect(rows(sql)).toEqual([
      { metric: 'videos_private', day: '2026-11-17', value: 1 },
      { metric: 'videos_public', day: '2026-11-17', value: 3 },
      { metric: 'views_total', day: '2026-11-17', value: 14 },
    ]);
  });
  it('sends the key in a header and never in the URL or in an error', async () => {
    const { sql, DB } = makeDb();
    const f = vi.fn(async () => Response.json({ error: { message: `API key ${KEY} not valid` } }, { status: 400 }));
    vi.stubGlobal('fetch', f);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r.ok).toBe(false);
    expect(f.mock.calls[0][0]).not.toContain(KEY);
    expect(f.mock.calls[0][1].headers['x-goog-api-key']).toBe(KEY);
    expect(r.error).toContain('HTTP 400');
    expect(JSON.stringify(r) + sql.prepare(`SELECT value FROM meta WHERE key = 'youtube_last_error'`).get().value).not.toContain(KEY);
    expect(rows(sql)).toEqual([]);
  });
  it('tries again after a failure at most 4 times a day, and is off without the key', async () => {
    const { DB } = makeDb();
    const f = vi.fn(async () => { throw new Error('boom'); });
    vi.stubGlobal('fetch', f);
    await runDailyYoutube(envOf(DB, { YOUTUBE_API_KEY: undefined }), T1);
    expect(f).toHaveBeenCalledTimes(0);
    for (let h = 0; h < 8; h++) await runDailyYoutube(envOf(DB), T1 + h * 3600000);
    expect(f).toHaveBeenCalledTimes(4);
    expect(await fetchYoutube(envOf(DB), T1)).toEqual({ ok: false, error: 'boom' });
  });
});
