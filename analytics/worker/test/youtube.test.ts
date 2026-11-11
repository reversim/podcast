// @ts-nocheck
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchYoutube, handleYoutubeRefresh, redact, runDailyYoutube, youtubeStats } from '../src/youtube';
import { buildStats } from '../src/stats';
import type { Env } from '../src/env';

const KEY = 'AIzaSyFAKE-KEY-1234567890';
const CH = 'UCYo4kdfR4KkHKMaE6xqO8XA';
const T1 = Date.UTC(2026, 10, 11, 3, 7); // 2026-11-11 03:07

/** Real SQLite behind a D1-shaped facade, so the SQL (json_each, upserts, subqueries) is exercised. */
function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const calls = { batches: [] as number[], prepares: 0 };
  const stmt = (q: string, args: unknown[] = []) => ({
    q, args,
    bind: (...a: unknown[]) => stmt(q, a),
    all: async () => ({ results: sql.prepare(q).all(...(args as any[])) as any[] }),
    first: async () => (sql.prepare(q).get(...(args as any[])) as any) ?? null,
    run: async () => ({ meta: { changes: Number(sql.prepare(q).run(...(args as any[])).changes) } }),
  });
  const DB = {
    prepare: (q: string) => { calls.prepares++; return stmt(q); },
    batch: async (s: ReturnType<typeof stmt>[]) => { calls.batches.push(s.length); for (const x of s) sql.prepare(x.q).run(...(x.args as any[])); return []; },
  };
  return { sql, DB, calls };
}

const envOf = (DB: unknown, o: Partial<Env> = {}) =>
  ({ DB, STATS_HOST: 'stats.reversim.com', YOUTUBE_API_KEY: KEY, YOUTUBE_CHANNEL_ID: CH, ...o }) as unknown as Env;

interface FakeVideo { id: string; title?: string; views: number }
/** Stubbed YouTube API. `videos` is newest first. */
function fakeApi(opts: { videos?: FakeVideo[]; hidden?: boolean; subs?: string; fail?: (url: URL) => Response | Error | null } = {}) {
  const videos = opts.videos ?? [];
  const urls: URL[] = [];
  const fn = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input)); urls.push(url);
    const bad = opts.fail?.(url);
    if (bad instanceof Error) throw bad;
    if (bad) return bad;
    const p = url.pathname.replace('/youtube/v3/', '');
    if (p === 'channels') {
      return Response.json({ items: [{ id: CH, snippet: { title: 'Reversim' },
        contentDetails: { relatedPlaylists: { uploads: 'UU' + CH.slice(2) } },
        statistics: { viewCount: '123456', videoCount: String(videos.length), hiddenSubscriberCount: !!opts.hidden, ...(opts.hidden ? {} : { subscriberCount: opts.subs ?? '2340' }) } }] });
    }
    if (p === 'playlistItems') {
      const off = Number(url.searchParams.get('pageToken') ?? 0);
      const page = videos.slice(off, off + 50);
      return Response.json({ items: page.map((v) => ({ contentDetails: { videoId: v.id } })), ...(off + 50 < videos.length ? { nextPageToken: String(off + 50) } : {}) });
    }
    if (p === 'videos') {
      const ids = (url.searchParams.get('id') ?? '').split(',');
      return Response.json({ items: videos.filter((v) => ids.includes(v.id)).map((v) => ({ id: v.id,
        snippet: { title: v.title ?? 'Title ' + v.id, publishedAt: '2025-03-04T10:00:00Z' },
        statistics: { viewCount: String(v.views), likeCount: '5', commentCount: '1' } })) });
    }
    return new Response('nope', { status: 404 });
  });
  return { fn, urls };
}
const vid = (n: number, views = 100 + n): FakeVideo => ({ id: 'v' + String(n).padStart(10, '0'), views });
const many = (n: number) => Array.from({ length: n }, (_, i) => vid(i));

let logs: string[];
beforeEach(() => {
  logs = [];
  for (const m of ['error', 'warn', 'log'] as const) vi.spyOn(console, m).mockImplementation((...a) => { logs.push(a.map(String).join(' ')); });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('not configured', () => {
  it.each([[{ YOUTUBE_API_KEY: undefined }], [{ YOUTUBE_CHANNEL_ID: '' }]])('does no fetch and logs nothing (%j)', async (o) => {
    const { DB } = makeDb(); const api = fakeApi(); vi.stubGlobal('fetch', api.fn);
    const e = envOf(DB, o as Partial<Env>);
    expect((await fetchYoutube(e, T1)).ok).toBe(false);
    await runDailyYoutube(e, T1);
    expect(api.fn).not.toHaveBeenCalled();
    expect(logs).toEqual([]);
    const res = await handleYoutubeRefresh(e, T1);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, error: expect.stringContaining('not configured') });
  });
});

describe('fetchYoutube', () => {
  it('stores channel rows and videos, uses followers metric', async () => {
    const { DB, sql } = makeDb(); vi.stubGlobal('fetch', fakeApi({ videos: many(3) }).fn);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r).toEqual({ ok: true, channel: { followers: 2340, views: 123456, videos: 3 }, videos_seen: 3, rows_written: 3 + 3 + 3 });
    expect(sql.prepare(`SELECT metric, day, value FROM platform_stats WHERE platform='youtube' ORDER BY metric`).all().map((x) => ({ ...x })))
      .toEqual([{ metric: 'followers', day: '2026-11-11', value: 2340 }, { metric: 'videos', day: '2026-11-11', value: 3 }, { metric: 'views', day: '2026-11-11', value: 123456 }]);
    expect(sql.prepare('SELECT count(*) c FROM yt_videos').get()).toMatchObject({ c: 3 });
    expect(sql.prepare(`SELECT value FROM meta WHERE key='youtube_day'`).get()).toMatchObject({ value: '2026-11-11' });
  });

  it('skips followers when subscribers are hidden but keeps views and videos', async () => {
    const { DB, sql } = makeDb(); vi.stubGlobal('fetch', fakeApi({ videos: many(1), hidden: true }).fn);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r).toMatchObject({ ok: true, channel: { followers: null } });
    const m = sql.prepare(`SELECT metric FROM platform_stats WHERE platform='youtube' ORDER BY metric`).all().map((x: any) => x.metric);
    expect(m).toEqual(['videos', 'views']);
  });

  it('pages through 3 playlist pages and chunks video ids by 50', async () => {
    const { DB, sql, calls } = makeDb(); const api = fakeApi({ videos: many(120) }); vi.stubGlobal('fetch', api.fn);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r).toMatchObject({ ok: true, videos_seen: 120 });
    const by = (n: string) => api.urls.filter((u) => u.pathname.endsWith('/' + n));
    expect(by('channels')).toHaveLength(1);
    expect(by('playlistItems').map((u) => u.searchParams.get('pageToken'))).toEqual([null, '50', '100']);
    expect(by('playlistItems')[0].searchParams.get('maxResults')).toBe('50');
    expect(by('videos').map((u) => u.searchParams.get('id')!.split(',').length)).toEqual([50, 50, 20]);
    expect(api.urls.every((u) => u.searchParams.get('key') === KEY)).toBe(true);
    expect(sql.prepare('SELECT count(*) c FROM yt_video_daily').get()).toMatchObject({ c: 120 });
    expect(Math.max(...calls.batches)).toBeLessThanOrEqual(50);
  });

  it('caps at 1000 videos, 41 fetches, and logs it', async () => {
    const { DB, sql, calls } = makeDb(); const api = fakeApi({ videos: many(1234) }); vi.stubGlobal('fetch', api.fn);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r).toMatchObject({ ok: true, videos_seen: 1000 });
    expect(api.fn).toHaveBeenCalledTimes(41);
    expect(sql.prepare('SELECT count(*) c FROM yt_videos').get()).toMatchObject({ c: 1000 });
    expect(sql.prepare(`SELECT 1 FROM yt_videos WHERE video_id = ?`).get(vid(1000).id)).toBeUndefined(); // the oldest are dropped
    expect(logs.filter((l) => l.includes('1000'))).toHaveLength(1);
    expect(calls.batches.every((n) => n <= 50)).toBe(true);
    expect(api.fn.mock.calls.length + calls.batches.length + 2).toBeLessThanOrEqual(50); // fetches + D1 calls (+ read, marker read)
  });

  it('writes a video row only when views changed, or the video is new; one row per video per day', async () => {
    const { DB, sql } = makeDb(); const e = envOf(DB);
    const vs = [vid(1, 100), vid(2, 200), vid(3, 300)];
    vi.stubGlobal('fetch', fakeApi({ videos: vs }).fn);
    await fetchYoutube(e, T1);
    // next day: only video 2 changes
    vi.stubGlobal('fetch', fakeApi({ videos: [vid(1, 100), vid(2, 250), vid(3, 300)] }).fn);
    const r2 = await fetchYoutube(e, T1 + 86400000) as any;
    expect(r2.rows_written).toBe(3 + 1);
    expect(sql.prepare('SELECT count(*) c FROM yt_video_daily').get()).toMatchObject({ c: 4 });
    // same day again with a new video and a changed view: upsert, no duplicate row
    vi.stubGlobal('fetch', fakeApi({ videos: [vid(4, 5), vid(1, 100), vid(2, 260), vid(3, 300)] }).fn);
    const r3 = await fetchYoutube(e, T1 + 86400000 + 3600000) as any;
    expect(r3.rows_written).toBe(3 + 1 + 1 + 1); // channel rows + new video meta + new video daily + changed video
    expect(sql.prepare(`SELECT views FROM yt_video_daily WHERE video_id = ? AND day = '2026-11-12'`).all(vid(2).id)).toEqual([{ views: 260 }]);
    expect(sql.prepare('SELECT count(*) c FROM yt_video_daily').get()).toMatchObject({ c: 5 });
    // a title change rewrites yt_videos but not the daily row
    vi.stubGlobal('fetch', fakeApi({ videos: [vid(4, 5), { ...vid(1, 100), title: 'New title' }, vid(2, 260), vid(3, 300)] }).fn);
    const r4 = await fetchYoutube(e, T1 + 86400000 + 7200000) as any;
    expect(r4.rows_written).toBe(3 + 1);
    expect(sql.prepare(`SELECT title FROM yt_videos WHERE video_id = ?`).get(vid(1).id)).toEqual({ title: 'New title' });
  });
});

describe('errors', () => {
  const errBody = (status: number, reason: string, message: string) =>
    new Response(JSON.stringify({ error: { code: status, message, errors: [{ reason }] } }), { status, headers: { 'content-type': 'application/json' } });
  const cases: [string, (u: URL) => Response | Error | null, string][] = [
    ['403 keyInvalid', () => errBody(403, 'keyInvalid', `API key not valid. Please pass a valid API key. (key=${KEY})`), 'keyInvalid'],
    ['403 quotaExceeded', () => errBody(403, 'quotaExceeded', 'The request cannot be completed because you have exceeded your quota.'), 'quotaExceeded'],
    ['network throw', (u) => new TypeError(`fetch failed for ${u.toString()}`), 'network error'],
    ['failure on page 2', (u) => (u.pathname.endsWith('playlistItems') && u.searchParams.get('pageToken') ? errBody(500, 'backendError', 'oops') : null), 'backendError'],
  ];
  it.each(cases)('%s: no throw, key never leaks', async (_n, fail, expectText) => {
    const { DB, sql } = makeDb(); vi.stubGlobal('fetch', fakeApi({ videos: many(80), fail }).fn);
    const r = await fetchYoutube(envOf(DB), T1);
    expect(r.ok).toBe(false);
    expect((r as any).error).toContain(expectText);
    expect(JSON.stringify(r)).not.toContain(KEY);
    expect(logs.join('\n')).not.toContain(KEY);
    expect(logs.join('\n')).not.toMatch(/key=AIza/);
    expect(logs).toHaveLength(1);
    expect(sql.prepare(`SELECT value FROM meta WHERE key='youtube_day'`).get()).toBeUndefined();
    const res = await handleYoutubeRefresh(envOf(DB), T1);
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain(KEY);
  });
  it('redact strips key= values and the exact key', () => {
    expect(redact('GET https://x/y?part=a&key=SECRET&id=1', 'SECRET')).toBe('GET https://x/y?part=a&key=REDACTED&id=1');
    expect(redact('bad SECRET here', 'SECRET')).toBe('bad REDACTED here');
  });
});

describe('once-per-day gate', () => {
  it('waits for 03:00, runs once, runs again the next day', async () => {
    const { DB } = makeDb(); const api = fakeApi({ videos: many(2) }); vi.stubGlobal('fetch', api.fn);
    const e = envOf(DB);
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 2, 7));
    expect(api.fn).not.toHaveBeenCalled();
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 3, 7));
    const n = api.fn.mock.calls.length;
    expect(n).toBeGreaterThan(0);
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 4, 7));
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 23, 7));
    expect(api.fn.mock.calls.length).toBe(n);
    await runDailyYoutube(e, Date.UTC(2026, 10, 12, 3, 7));
    expect(api.fn.mock.calls.length).toBe(2 * n);
  });
  it('catches up later in the day (no run at 03:00) and retries after a failure', async () => {
    const { DB } = makeDb(); const e = envOf(DB);
    let bad = true;
    const api = fakeApi({ videos: many(1), fail: () => (bad ? new Error('offline') : null) }); vi.stubGlobal('fetch', api.fn);
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 3, 7)); // fails
    bad = false;
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 4, 7)); // retry works
    const n = api.fn.mock.calls.length;
    await runDailyYoutube(e, Date.UTC(2026, 10, 11, 5, 7));
    expect(api.fn.mock.calls.length).toBe(n);
  });
  it('never throws when the database fails', async () => {
    const DB = { prepare: () => { throw new Error('d1 down'); } };
    await expect(runDailyYoutube(envOf(DB), T1)).resolves.toBeUndefined();
  });
});

describe('youtube block of /api/stats', () => {
  const seed = (sql: DatabaseSync) => {
    sql.exec(`INSERT INTO yt_videos VALUES ('a','A','2026-01-01'),('b','B','2026-02-01'),('c','C','2026-10-01'),('d','D','2026-11-05'),('e','E','2026-03-01')`);
    sql.exec(`INSERT INTO yt_video_daily (day, video_id, views) VALUES
      ('2026-09-01','a',100),('2026-10-20','a',130),('2026-11-10','a',150),   -- base 100 (before range start 2026-10-12)... see below
      ('2026-10-12','b',500),('2026-11-10','b',560),                          -- base on the start day itself
      ('2026-10-20','c',10),('2026-11-10','c',40),                            -- starts inside the range
      ('2026-11-10','d',7),                                                   -- one point
      ('2026-08-01','e',900)                                                  -- unchanged for the whole range`);
    sql.exec(`INSERT INTO meta VALUES ('youtube_day','2026-11-10')`);
  };
  it('computes views_in_range and sorts', async () => {
    const { DB, sql } = makeDb(); seed(sql);
    const out = await youtubeStats(envOf(DB), '2026-10-12');
    expect(out).toMatchObject({ channel_id: CH, configured: true, last_day: '2026-11-10' });
    expect(out.videos).toEqual([
      { id: 'a', title: 'A', published: '2026-01-01', views: 150, views_in_range: 50 },
      { id: 'b', title: 'B', published: '2026-02-01', views: 560, views_in_range: 60 },
      { id: 'c', title: 'C', published: '2026-10-01', views: 40, views_in_range: 30 },
      { id: 'e', title: 'E', published: '2026-03-01', views: 900, views_in_range: 0 },
      { id: 'd', title: 'D', published: '2026-11-05', views: 7, views_in_range: 0 },
    ].sort((x, y) => y.views_in_range - x.views_in_range || y.views - x.views));
    expect((out.videos as any[]).map((v) => v.id)).toEqual(['b', 'a', 'c', 'e', 'd']);
  });
  it('keeps only the top 200', async () => {
    const { DB, sql } = makeDb();
    sql.exec('BEGIN');
    for (let i = 0; i < 250; i++) { sql.exec(`INSERT INTO yt_videos VALUES ('v${i}','t','2026-01-01')`); sql.exec(`INSERT INTO yt_video_daily (day, video_id, views) VALUES ('2026-11-01','v${i}',${i})`); }
    sql.exec('COMMIT');
    expect((await youtubeStats(envOf(DB), '2026-10-12')).videos).toHaveLength(200);
  });
  it('reports configured=false and an empty list when unconfigured', async () => {
    const { DB } = makeDb();
    expect(await youtubeStats(envOf(DB, { YOUTUBE_API_KEY: undefined }), '2026-10-12')).toEqual({ channel_id: CH, configured: false, last_day: '', videos: [] });
  });
  it('a missing table never breaks buildStats', async () => {
    const DB = { prepare: (q: string) => ({ bind: () => ({ all: async () => { if (q.includes('yt_video')) throw new Error('no such table: yt_videos'); return { results: [] }; } }),
      all: async () => ({ results: [] }) }) };
    const out = await buildStats(envOf(DB), 30, T1);
    expect(out.youtube).toEqual({ channel_id: CH, configured: true, last_day: '', videos: [] });
    expect(out).toHaveProperty('platforms');
    expect(out).toHaveProperty('web');
  });
});
