// @ts-nocheck
// Reply shapes were read from the live web app on 2026-11-16:
//   GET /auth/csrf?path=... -> 302, Location: <path>?csrf-token=...
//   POST /api/metrics/podcast -> {data:{<name>TimeSeries:[{time,value}], followsTotals:{total}}, error:{errors:[]}}
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { amazonStats, fetchAmazon, handleAmazonRefresh, redactAmazon, runDailyAmazon, seriesRows, AMZ_EXPIRED } from '../src/amazon';
import type { Env } from '../src/env';

const COOKIE = 'at-main=Atza|SECRETatmainVALUE123; sess-at-main="SECRETsessVALUE456="; session-id=111-2222222-3333333; ubid-main=444-5555555-6666666; x-main=SECRETxmainVALUE789';
const POD = 'c8ba795c-011b-4aba-9438-c838216078c5';
const CSRF = 'gSECRETcsrfTOKENvalue+abc/def==';
const T1 = Date.UTC(2026, 10, 16, 5, 7); // 2026-11-16 05:07
const DAY = 86400000;
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const stmt = (q: string, args: unknown[] = []) => ({
    q, args,
    bind: (...a: unknown[]) => stmt(q, a),
    all: async () => ({ results: sql.prepare(q).all(...(args as any[])) as any[] }),
    first: async () => (sql.prepare(q).get(...(args as any[])) as any) ?? null,
    run: async () => ({ meta: { changes: Number(sql.prepare(q).run(...(args as any[])).changes) } }),
  });
  const DB = { prepare: (q: string) => stmt(q), batch: async (s: any[]) => { for (const x of s) sql.prepare(x.q).run(...x.args); return []; } };
  return { sql, DB };
}
const envOf = (DB: unknown, o: Partial<Env> = {}) => ({ DB, STATS_HOST: 'stats.reversim.com', AMAZON_PODCAST_ID: POD, AMAZON_COOKIE: COOKIE, ...o }) as unknown as Env;

/** 31 points (30 days and today). `plays` is the value of each day; other series are zero. */
const tsOf = (now: number, value: number) => Array.from({ length: 31 }, (_, i) => ({ time: ymd(now - (30 - i) * DAY) + 'T00:00:00.000Z', value }));

function mockFetch(o: { csrf?: Response; metrics?: (body: any) => Response; plays?: number; followers?: number } = {}) {
  const calls: { url: string; init: any }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
    calls.push({ url, init });
    if (url.includes('/auth/csrf')) return o.csrf ?? new Response(null, { status: 302, headers: { location: `https://podcasters.amazon.com/podcasts?csrf-token=${encodeURIComponent(CSRF)}` } });
    const body = JSON.parse(init.body);
    if (o.metrics) return o.metrics(body);
    if (body.followsTotals) return Response.json({ data: { followsTotals: { total: o.followers ?? 7 } }, error: { errors: [] } });
    return Response.json({ data: { startsTimeSeries: tsOf(T1, 0), playsTimeSeries: tsOf(T1, o.plays ?? 3), listenersTimeSeries: tsOf(T1, 2), engagedListenersTimeSeries: tsOf(T1, 0) }, error: { errors: [] } });
  }));
  return calls;
}
afterEach(() => vi.unstubAllGlobals());

describe('seriesRows', () => {
  it('keeps the days in the window and drops an all-zero series', () => {
    const rows = seriesRows({ playsTimeSeries: tsOf(T1, 4), startsTimeSeries: tsOf(T1, 0) }, '2026-11-10', '2026-11-15');
    expect(rows.every((r) => r.m === 'plays')).toBe(true);
    expect(rows.map((r) => r.d)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
  });
  it('ignores bad points', () => {
    expect(seriesRows({ playsTimeSeries: [{ time: 'x', value: 1 }, { time: '2026-11-12T00:00:00.000Z', value: -1 }, null] }, '2026-11-01', '2026-11-15')).toEqual([]);
  });
});

describe('fetchAmazon', () => {
  it('stores 30 days and the followers, sends the cookie and the token, and records success', async () => {
    const { sql, DB } = makeDb();
    const calls = mockFetch();
    const r = await fetchAmazon(envOf(DB), T1);
    expect(r).toEqual({ ok: true, days_written: 31, followers: 7, subrequests: 3 });
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.url.startsWith('https://podcasters.amazon.com/'))).toBe(true);
    expect(calls[1].init.headers['csrf-token']).toBe(CSRF);
    expect(JSON.parse(calls[1].init.body).podcastIds).toEqual([POD]);
    const by = sql.prepare(`SELECT metric, count(*) AS n, min(day) AS a, max(day) AS b FROM platform_stats WHERE platform = 'amazon' GROUP BY metric ORDER BY metric`).all();
    expect(by).toEqual([
      { metric: 'followers', n: 1, a: '2026-11-16', b: '2026-11-16' },
      { metric: 'listeners', n: 30, a: '2026-10-17', b: '2026-11-15' },
      { metric: 'plays', n: 30, a: '2026-10-17', b: '2026-11-15' },
    ]);
    const s = await amazonStats(envOf(DB));
    expect(s.configured).toBe(true);
    expect(s.last_ok).toBe(new Date(T1).toISOString());
    expect(s.last_error).toBe('');
  });

  it('a second run replaces the values', async () => {
    const { sql, DB } = makeDb();
    mockFetch({ plays: 3 }); await fetchAmazon(envOf(DB), T1);
    mockFetch({ plays: 5 }); await fetchAmazon(envOf(DB), T1);
    expect(sql.prepare(`SELECT sum(value) AS v, count(*) AS n FROM platform_stats WHERE metric = 'plays'`).get()).toEqual({ v: 150, n: 30 });
  });

  it('a redirect to the sign-in page means expired cookies, and stops the retries for the day', async () => {
    const { sql, DB } = makeDb();
    const calls = mockFetch({ csrf: new Response(null, { status: 302, headers: { location: 'https://www.amazon.com/ap/signin?x=1' } }) });
    const r = await fetchAmazon(envOf(DB), T1);
    expect(r).toEqual({ ok: false, error: AMZ_EXPIRED });
    expect(calls).toHaveLength(1);
    await runDailyAmazon(envOf(DB), T1 + 3600000);
    expect(calls).toHaveLength(1);
    expect((await amazonStats(envOf(DB))).last_error).toContain(AMZ_EXPIRED);
    expect(sql.prepare(`SELECT count(*) AS n FROM platform_stats`).get()).toEqual({ n: 0 });
  });

  it('401 from the API means expired cookies', async () => {
    const { DB } = makeDb();
    mockFetch({ metrics: () => Response.json({ message: 'Unauthorized' }, { status: 401 }) });
    expect(await fetchAmazon(envOf(DB), T1)).toEqual({ ok: false, error: AMZ_EXPIRED });
  });

  it('a network error never throws and never shows a secret', async () => {
    const { DB } = makeDb();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(`boom ${COOKIE} csrf-token=${CSRF}`); }));
    const r = await fetchAmazon(envOf(DB), T1);
    expect(r.ok).toBe(false);
    const text = JSON.stringify(r) + JSON.stringify(await amazonStats(envOf(DB)));
    for (const s of ['SECRETatmainVALUE123', 'SECRETsessVALUE456', 'SECRETxmainVALUE789', 'SECRETcsrfTOKEN']) expect(text).not.toContain(s);
  });

  it('is off without the secret', async () => {
    const { DB } = makeDb();
    const calls = mockFetch();
    expect((await fetchAmazon(envOf(DB, { AMAZON_COOKIE: undefined }), T1)).ok).toBe(false);
    await runDailyAmazon(envOf(DB, { AMAZON_COOKIE: undefined }), T1);
    expect(calls).toHaveLength(0);
    expect((await handleAmazonRefresh(envOf(DB, { AMAZON_COOKIE: undefined }), T1)).status).toBe(400);
  });
});

describe('daily schedule', () => {
  it('runs once per UTC day, from 05:00, and retries a failure at most 4 times', async () => {
    const { DB } = makeDb();
    let calls = mockFetch();
    await runDailyAmazon(envOf(DB), Date.UTC(2026, 10, 16, 4, 7));
    expect(calls).toHaveLength(0);
    await runDailyAmazon(envOf(DB), T1);
    await runDailyAmazon(envOf(DB), T1 + 3600000);
    expect(calls).toHaveLength(3);
    calls = mockFetch({ metrics: () => new Response('x', { status: 500 }) });
    for (let h = 0; h < 8; h++) await runDailyAmazon(envOf(DB), T1 + DAY + h * 3600000);
    expect(calls).toHaveLength(8); // 4 tries, 2 fetches each
  });
});

describe('redactAmazon', () => {
  it('removes cookie values and tokens', () => {
    const out = redactAmazon(`x ${COOKIE} y csrf-token=abc123 z`, envOf(null));
    expect(out).not.toContain('SECRET');
    expect(out).toContain('csrf-token=REDACTED');
  });
});
