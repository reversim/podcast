// @ts-nocheck
// Response shapes follow the Open Podcast project (MIT): github.com/openpodcast/spotify-connector (spotifyconnector/connector.py)
// and the sample/fixture JSON in github.com/openpodcast/pipelines (spotify/data/*) and github.com/openpodcast/api (fixtures/spotify*.json):
//   followers/listeners -> {counts:[{count,date}]}, detailedStreams -> {detailedStreams:[{date,starts,streams}]},
//   episodes -> {episodes:[{name,id,url,releaseDate,starts,streams,listeners,...}], totalPages}, episode metadata -> {name,id,releaseDate,starts,streams,listeners,...},
//   auth page -> HTML with `const authorizationResponse = {...};` or `login_required`, token -> {access_token, expires_in}.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { codeChallenge, fetchSpotify, handleSpotifyRefresh, parseAuthPage, redact, runDailySpotify, spotifyStats, streamRows, EXPIRED, MAX_SUBREQUESTS, pacing } from '../src/spotify';

pacing.episodePauseMs = 0; // no real waiting in tests
import { buildStats } from '../src/stats';
import type { Env } from '../src/env';

const DC = 'AQDsecretdccookievalue-0123456789-abcdefghijklmnopqrstuvwxyz';
const KEY = '11111111-2222-3333-4444-555555555555';
const SHOW = '6g7ZUYZV6bsWDTayF6hXtj';
const TOKEN = 'BQDtokenSECRETvalue_9876543210';
const CODE = 'AQCauthCODEvalue123456';
const T1 = Date.UTC(2026, 10, 11, 4, 7); // 2026-11-11 04:07
const DAY = 86400000;

function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const calls = { batches: [] as number[] };
  const stmt = (q: string, args: unknown[] = []) => ({
    q, args,
    bind: (...a: unknown[]) => stmt(q, a),
    all: async () => ({ results: sql.prepare(q).all(...(args as any[])) as any[] }),
    first: async () => (sql.prepare(q).get(...(args as any[])) as any) ?? null,
    run: async () => ({ meta: { changes: Number(sql.prepare(q).run(...(args as any[])).changes) } }),
  });
  const DB = {
    prepare: (q: string) => stmt(q),
    batch: async (s: ReturnType<typeof stmt>[]) => { calls.batches.push(s.length); for (const x of s) sql.prepare(x.q).run(...(x.args as any[])); return []; },
  };
  return { sql, DB, calls };
}

const envOf = (DB: unknown, o: Partial<Env> = {}) =>
  ({ DB, STATS_HOST: 'stats.reversim.com', SPOTIFY_SHOW_ID: SHOW, SPOTIFY_SP_DC: DC, SPOTIFY_SP_KEY: KEY, ...o }) as unknown as Env;

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const eachDay = (a: string, b: string) => { const o: string[] = []; for (let t = Date.parse(a); t <= Date.parse(b); t += DAY) o.push(ymd(t)); return o; };

interface Ep { id: string; name: string; releaseDate: string; streams?: number; listeners?: number; starts?: number }
const epId = (n: number) => 'EP' + String(n).padStart(20, '0');
const mkEps = (n: number, withTotals = true): Ep[] => Array.from({ length: n }, (_, i) => ({
  id: epId(i), name: `${n - i} - Episode ${n - i}`, releaseDate: ymd(Date.UTC(2026, 10, 1) - i * 7 * DAY),
  ...(withTotals ? { starts: 0, streams: 100 + i, listeners: 50 + i } : { starts: 0, streams: 0, listeners: 0 }),
}));

interface Opts {
  eps?: Ep[]; first?: string; // first day with data
  bump?: number; // added to every series value (a "revision")
  startsReal?: boolean;
  authHtml?: (state: string) => Response;
  authRedirect?: string;
  tokenStatus?: number;
  apiFail?: (path: string) => Response | Error | null;
  size?: number;
}
function fakeSpotify(o: Opts = {}) {
  const eps = o.eps ?? mkEps(3);
  const first = o.first ?? '2024-01-01';
  const seen: { url: URL; init?: RequestInit }[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input)); seen.push({ url, init });
    const h = (init?.headers ?? {}) as Record<string, string>;
    if (url.host === 'accounts.spotify.com' && url.pathname === '/oauth2/v2/auth') {
      expect(init?.redirect).toBe('manual');
      if (o.authRedirect) return new Response(null, { status: 302, headers: { location: o.authRedirect } });
      if (o.authHtml) return o.authHtml(url.searchParams.get('state')!);
      expect(h.cookie).toBe(`sp_dc=${DC}; sp_key=${KEY}`);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('response_mode')).toBe('web_message');
      expect(url.searchParams.get('prompt')).toBe('none');
      expect(url.searchParams.get('client_id')).toBe('05a1371ee5194c27860b3ff3ff3979d2');
      const st = url.searchParams.get('state');
      return new Response(`<html><script>const authorizationResponse = {type: "authorization_response", response: {code: "${CODE}", state: "${st}"}};</script></html>`,
        { headers: { 'content-type': 'text/html' } });
    }
    if (url.host === 'accounts.spotify.com' && url.pathname === '/api/token') {
      expect(h.cookie).toBeUndefined();
      const body = new URLSearchParams(String(init?.body));
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe(CODE);
      expect(body.get('code_verifier')).toMatch(/^[A-Za-z0-9]{64}$/);
      if (o.tokenStatus) return new Response('{"error":"invalid_grant"}', { status: o.tokenStatus });
      return Response.json({ access_token: TOKEN, token_type: 'Bearer', expires_in: 3600 });
    }
    if (url.host === 'generic.wg.spotify.com') {
      expect(h.authorization).toBe('Bearer ' + TOKEN);
      expect(h.cookie).toBeUndefined();
      const p = url.pathname.replace('/podcasters/v0/', '');
      const bad = o.apiFail?.(p);
      if (bad instanceof Error) throw bad;
      if (bad) return bad;
      const q = url.searchParams;
      const days = () => eachDay(q.get('start')!, q.get('end')!).filter((d) => d >= first);
      const v = (d: string, k: number) => (Date.parse(d) / DAY) % 50 + k + (o.bump ?? 0);
      if (p === `shows/${SHOW}/followers`) return Response.json({ counts: days().map((d) => ({ count: v(d, 1000), date: d })) });
      if (p === `shows/${SHOW}/listeners`) return Response.json({ counts: days().map((d) => ({ count: v(d, 100), date: d })) });
      if (p === `shows/${SHOW}/detailedStreams`) {
        return Response.json({ detailedStreams: days().map((d) => ({ date: d, starts: o.startsReal ? v(d, 200) : 0, streams: v(d, 150) })) });
      }
      if (p === `shows/${SHOW}/episodes`) {
        const size = Number(q.get('size')), page = Number(q.get('page'));
        expect(q.get('sortBy')).toBe('releaseDate');
        return Response.json({ episodes: eps.slice((page - 1) * size, page * size), totalPages: Math.max(1, Math.ceil(eps.length / size)), page, size });
      }
      const m = /^episodes\/(\w+)\/metadata$/.exec(p);
      if (m) {
        const e = eps.find((x) => x.id === m[1]);
        return e ? Response.json({ ...e, starts: 7, streams: 77, listeners: 33, sparkLine: [] }) : new Response('{}', { status: 404 });
      }
    }
    return new Response('nope', { status: 404 });
  });
  return { fn, seen, count: () => fn.mock.calls.length };
}

let logs: string[];
beforeEach(() => {
  logs = [];
  for (const m of ['error', 'warn', 'log', 'info'] as const) vi.spyOn(console, m).mockImplementation((...a) => { logs.push(a.map(String).join(' ')); });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const meta = (sql: any, k: string) => sql.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
const stat = (sql: any, m: string) => sql.prepare(`SELECT day, value FROM platform_stats WHERE platform = 'spotify' AND metric = ? ORDER BY day`).all(m) as { day: string; value: number }[];
const SECRETS = [DC, KEY, TOKEN, CODE];
const noSecrets = (text: string) => { for (const s of SECRETS) expect(text).not.toContain(s); };

describe('pure helpers', () => {
  it('PKCE challenge matches the RFC 7636 test vector', async () => {
    expect(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
  it('parses the web_message page as JSON, as YAML-like text, and as login_required', () => {
    const a = parseAuthPage(`<script>const authorizationResponse = {"type":"authorization_response","response":{"code":"C1","state":"S1"}};</script>`);
    expect(a).toMatchObject({ code: 'C1', state: 'S1' });
    const b = parseAuthPage(`<script>const authorizationResponse = {type: authorization_response, response: {code: C2, state: S2}};</script>`);
    expect(b).toMatchObject({ code: 'C2', state: 'S2' });
    const c = parseAuthPage(`<script>const authorizationResponse = {type: "authorization_response", response: {error: "login_required", state: "S3"}};</script>`);
    expect(c.error).toBe('login_required');
    expect(parseAuthPage('<html>nothing</html>')).toEqual({});
  });
  it('redacts cookies, tokens and key=value shapes', () => {
    const t = redact(`Cookie: sp_dc=${DC}; sp_key=${KEY} Authorization: Bearer ${TOKEN} {"access_token":"${TOKEN}"} code=${CODE}`, [DC]);
    noSecrets(t);
    expect(t).toContain('REDACTED');
  });
  it('drops an all-zero starts series (Spotify removed starts in May 2025)', () => {
    const zero = streamRows({ detailedStreams: [{ date: '2026-01-01', starts: 0, streams: 5 }, { date: '2026-01-02', starts: 0, streams: 6 }] });
    expect(zero.map((r) => r.m)).toEqual(['streams', 'streams']);
    const real = streamRows({ detailedStreams: [{ date: '2026-01-01', starts: 2, streams: 5 }] });
    expect(real.map((r) => r.m).sort()).toEqual(['starts', 'streams']);
  });
});

describe('not configured', () => {
  it.each([[{ SPOTIFY_SP_DC: undefined }], [{ SPOTIFY_SP_KEY: '' }], [{ SPOTIFY_SHOW_ID: '' }]])('does no fetch and logs nothing (%j)', async (o) => {
    const { DB, sql } = makeDb(); const api = fakeSpotify(); vi.stubGlobal('fetch', api.fn);
    const e = envOf(DB, o as Partial<Env>);
    expect((await fetchSpotify(e, T1)).ok).toBe(false);
    await runDailySpotify(e, T1);
    expect(api.fn).not.toHaveBeenCalled();
    expect(logs).toEqual([]);
    const res = await handleSpotifyRefresh(e, T1);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, error: expect.stringContaining('not configured') });
    expect(sql.prepare('SELECT count(*) AS n FROM meta').get().n).toBe(0);
  });
});

describe('happy path', () => {
  it('authenticates, stores a 30-day window, episodes, status and stays under the cap', async () => {
    const { DB, sql } = makeDb(); const api = fakeSpotify({ eps: mkEps(120), first: '2026-09-01' }); vi.stubGlobal('fetch', api.fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r).toMatchObject({ ok: true, episodes_written: 120 });
    expect(r.subrequests).toBe(api.count());
    expect(r.subrequests).toBeLessThanOrEqual(MAX_SUBREQUESTS);
    for (const m of ['followers', 'listeners', 'streams']) {
      const rows = stat(sql, m);
      expect(rows.length).toBe(71); // first backfill chunk reaches back to 2026-09-01 (2026-11-10 .. 2026-09-01 = 71 days)
      expect(rows[rows.length - 1].day).toBe('2026-11-10'); // yesterday: today is partial and skipped
    }
    expect(stat(sql, 'starts')).toEqual([]); // all zero: not stored
    expect(r.days_written).toBe(71);
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes').get().n).toBe(120);
    expect(meta(sql, 'spotify_day')).toBe('2026-11-11');
    expect(meta(sql, 'spotify_last_ok')).toBe(new Date(T1).toISOString());
    expect(meta(sql, 'spotify_last_error')).toBeUndefined();
    expect(logs).toEqual([]);
    // the cookie header goes to the auth page only
    const withCookie = api.seen.filter((s) => (s.init?.headers as any)?.cookie);
    expect(withCookie.map((s) => s.url.pathname)).toEqual(['/oauth2/v2/auth']);
  });
  it('stores starts when Spotify still reports them', async () => {
    const { DB, sql } = makeDb(); vi.stubGlobal('fetch', fakeSpotify({ startsReal: true, first: '2026-10-01' }).fn);
    expect((await fetchSpotify(envOf(DB), T1)).ok).toBe(true);
    expect(stat(sql, 'starts').length).toBeGreaterThan(0);
  });
  it('uses at most 1 + 1 + 3 + pages + backfill and writes in small batches', async () => {
    const { DB, calls } = makeDb(); vi.stubGlobal('fetch', fakeSpotify({ eps: mkEps(520), first: '2020-01-01' }).fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r.ok).toBe(true);
    expect(r.subrequests).toBeLessThanOrEqual(MAX_SUBREQUESTS);
    expect(Math.max(...calls.batches)).toBeLessThanOrEqual(50);
  });
});

describe('failures', () => {
  const loginHtml = (st: string) => new Response(`<script>const authorizationResponse = {"type":"authorization_response","response":{"error":"login_required","state":"${st}"}};</script>`);
  it.each([
    ['login_required page', { authHtml: loginHtml }],
    ['401', { authHtml: () => new Response('no', { status: 401 }) }],
    ['403', { authHtml: () => new Response('no', { status: 403 }) }],
    ['redirect to the login page', { authRedirect: 'https://accounts.spotify.com/en/login?continue=x' }],
    ['token step 401', { tokenStatus: 401 }],
  ])('expired cookies (%s) give the renew message and no hourly retry', async (_n, o) => {
    const { DB, sql } = makeDb(); const api = fakeSpotify(o); vi.stubGlobal('fetch', api.fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r).toEqual({ ok: false, error: EXPIRED });
    expect(meta(sql, 'spotify_last_error')).toContain(EXPIRED);
    expect(meta(sql, 'spotify_day')).toBe('2026-11-11'); // no more tries today
    const before = api.count();
    await runDailySpotify(envOf(DB), T1 + 3600e3);
    expect(api.count()).toBe(before);
    expect(stat(sql, 'streams')).toEqual([]);
    for (const l of logs) noSecrets(l);
  });
  it('429 on the API fails the run, keeps the day open and retries hourly up to 4 times a day', async () => {
    const { DB, sql } = makeDb(); const api = fakeSpotify({ apiFail: () => new Response('slow down', { status: 429 }) }); vi.stubGlobal('fetch', api.fn);
    const e = envOf(DB);
    for (let h = 0; h < 6; h++) await runDailySpotify(e, T1 + h * 3600e3);
    expect(meta(sql, 'spotify_day')).toBeUndefined();
    expect(meta(sql, 'spotify_last_error')).toContain('429');
    expect(meta(sql, 'spotify_attempts')).toBe('2026-11-11:4');
    expect(api.fn.mock.calls.filter(([u]) => String(u).endsWith('/oauth2/v2/auth') || String(u).includes('/oauth2/v2/auth?')).length).toBe(4);
    const r = await fetchSpotify(e, T1);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('429') });
  });
  it('a network throw becomes a redacted error and never throws', async () => {
    const { DB, sql } = makeDb();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(`connect failed, sp_dc=${DC} Bearer ${TOKEN}`); }));
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r.ok).toBe(false);
    noSecrets(JSON.stringify(r)); noSecrets(meta(sql, 'spotify_last_error')); noSecrets(logs.join('\n'));
    expect(r.error).toContain('network error');
    await expect(runDailySpotify(envOf(DB), T1 + 7200e3)).resolves.toBeUndefined();
  });
  it('an episode-list failure keeps the series and reports a warning', async () => {
    const { DB, sql } = makeDb();
    vi.stubGlobal('fetch', fakeSpotify({ first: '2026-10-20', apiFail: (p) => (p.endsWith('/episodes') ? new Response('x', { status: 500 }) : null) }).fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r).toMatchObject({ ok: true, episodes_written: 0, warning: expect.stringContaining('episodes') });
    expect(stat(sql, 'streams').length).toBeGreaterThan(0);
    expect(meta(sql, 'spotify_last_error')).toContain('episodes');
  });
  it('403 from the API tells the owner to check the show id', async () => {
    const { DB } = makeDb();
    vi.stubGlobal('fetch', fakeSpotify({ apiFail: () => new Response('User does not own station', { status: 403 }) }).fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('SPOTIFY_SHOW_ID') });
  });
});

describe('subrequest cap', () => {
  it('never goes over 40, even with a huge episode list and per-episode calls', async () => {
    const { DB, sql } = makeDb();
    const api = fakeSpotify({ eps: mkEps(3000, false), first: '2016-01-01' }); vi.stubGlobal('fetch', api.fn);
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r.ok).toBe(true);
    expect(api.count()).toBeLessThanOrEqual(MAX_SUBREQUESTS);
    expect(r.subrequests).toBe(api.count());
    const perEp = api.seen.filter((s) => /\/episodes\/\w+\/metadata$/.test(s.url.pathname)).length;
    expect(perEp).toBeLessThanOrEqual(20);
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes').get().n).toBeLessThanOrEqual(14 * 50 + 1);
  });
});

describe('daily schedule', () => {
  it('runs once per UTC day, only from 04:00', async () => {
    const { DB, sql } = makeDb(); const api = fakeSpotify({ first: '2026-11-01' }); vi.stubGlobal('fetch', api.fn);
    const e = envOf(DB);
    await runDailySpotify(e, Date.UTC(2026, 10, 11, 3, 7));
    expect(api.count()).toBe(0);
    await runDailySpotify(e, T1);
    const n = api.count();
    expect(n).toBeGreaterThan(0);
    await runDailySpotify(e, T1 + 3600e3);
    await runDailySpotify(e, Date.UTC(2026, 10, 11, 23, 7));
    expect(api.count()).toBe(n);
    await runDailySpotify(e, T1 + DAY);
    expect(api.count()).toBeGreaterThan(n);
    expect(meta(sql, 'spotify_day')).toBe('2026-11-12');
  });
});

describe('30-day window and backfill', () => {
  it('replaces revised values for recent days and leaves the row count unchanged', async () => {
    const { DB, sql } = makeDb();
    vi.stubGlobal('fetch', fakeSpotify({ first: '2026-10-01' }).fn);
    await fetchSpotify(envOf(DB), T1);
    const before = stat(sql, 'streams');
    vi.stubGlobal('fetch', fakeSpotify({ first: '2026-10-01', bump: 10 }).fn);
    await fetchSpotify(envOf(DB), T1 + DAY);
    const after = stat(sql, 'streams');
    expect(after.length).toBe(before.length + 1); // one new day: 2026-11-11
    const d = '2026-11-05';
    expect(after.find((r) => r.day === d)!.value).toBe(before.find((r) => r.day === d)!.value + 10);
    expect(sql.prepare(`SELECT count(*) AS n FROM platform_stats WHERE platform = 'spotify' AND metric = 'streams' AND day = ?`).get(d).n).toBe(1);
  });
  it('backfills a few chunks per run, resumes on later days and ends at the first empty chunk', async () => {
    const { DB, sql } = makeDb();
    const first = '2022-06-01';
    let runs = 0;
    for (; runs < 6 && meta(sql, 'spotify_backfill') !== 'done'; runs++) {
      vi.stubGlobal('fetch', fakeSpotify({ first, eps: mkEps(3) }).fn);
      const r = await fetchSpotify(envOf(DB), T1 + runs * DAY);
      expect(r.ok).toBe(true);
    }
    expect(runs).toBeGreaterThan(1); // more than one run: the history is spread over days
    expect(meta(sql, 'spotify_backfill')).toBe('done');
    expect(stat(sql, 'streams')[0].day).toBe(first);
    const n = stat(sql, 'streams').length;
    const api2 = fakeSpotify({ first, eps: mkEps(3) }); vi.stubGlobal('fetch', api2.fn);
    await fetchSpotify(envOf(DB), T1 + runs * DAY);
    // after the backfill is done: window only
    const series = api2.seen.filter((s) => /\/(followers|listeners|detailedStreams)$/.test(s.url.pathname));
    expect(series.length).toBe(3);
    expect(stat(sql, 'streams').length).toBe(n + 1);
  });
});

describe('per-episode rotation', () => {
  it('uses at most 12 metadata calls a day, newest never-fetched first', async () => {
    const { DB, sql } = makeDb();
    const eps = mkEps(45, false);
    const ids = (api: { seen: { url: URL }[] }) => api.seen.filter((s) => /\/episodes\/\w+\/metadata$/.test(s.url.pathname)).map((s) => s.url.pathname.split('/')[4]);
    const api = fakeSpotify({ eps, first: '2026-11-05' }); vi.stubGlobal('fetch', api.fn);
    await fetchSpotify(envOf(DB), T1);
    const ids1 = ids(api);
    expect(ids1.length).toBe(12);
    expect(ids1[0]).toBe(epId(0)); // newest
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes WHERE streams IS NOT NULL').get().n).toBe(12);
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes').get().n).toBe(45); // all names stored
    const api2 = fakeSpotify({ eps, first: '2026-11-05' }); vi.stubGlobal('fetch', api2.fn);
    await fetchSpotify(envOf(DB), T1 + DAY);
    const ids2 = ids(api2);
    expect(ids2.length).toBe(12);
    expect(ids2.some((i) => ids1.includes(i))).toBe(false); // never-fetched ones come first
  });

  it('a 429 during the per-episode calls keeps the names and the totals read so far', async () => {
    const { DB, sql } = makeDb();
    const api = fakeSpotify({ eps: mkEps(45, false), first: '2026-11-05' });
    let metaCalls = 0;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (/\/episodes\/\w+\/metadata$/.test(u.pathname) && ++metaCalls > 3) return Promise.resolve(new Response('slow down', { status: 429 }));
      return api.fn(input as never, init as never);
    });
    const r = await fetchSpotify(envOf(DB), T1);
    expect(r.ok).toBe(true);
    expect(metaCalls).toBe(4); // stopped at the first 429
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes').get().n).toBe(45);
    expect(sql.prepare('SELECT count(*) AS n FROM sp_episodes WHERE streams IS NOT NULL').get().n).toBe(3);
    expect(meta(sql, 'spotify_last_error')).toBeUndefined();
  });
});

describe('refresh endpoint and /api/stats', () => {
  it('refresh returns the counts', async () => {
    const { DB } = makeDb(); vi.stubGlobal('fetch', fakeSpotify({ first: '2026-11-01' }).fn);
    const res = await handleSpotifyRefresh(envOf(DB), T1);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, days_written: 10, episodes_written: 3, subrequests: expect.any(Number) });
  });
  it('refresh failure is 502 with a redacted message', async () => {
    const { DB } = makeDb(); vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom sp_key=' + KEY); }));
    const res = await handleSpotifyRefresh(envOf(DB), T1);
    expect(res.status).toBe(502);
    noSecrets(await res.text());
  });
  it('stats block: not configured, empty', async () => {
    const { DB } = makeDb();
    expect(await spotifyStats({ DB } as any)).toEqual({ configured: false, last_ok: '', last_error: '', episodes: [] });
  });
  it('stats block shape after a run, newest first, no secrets anywhere in /api/stats', async () => {
    const { DB, sql } = makeDb(); vi.stubGlobal('fetch', fakeSpotify({ eps: mkEps(5), first: '2026-11-01' }).fn);
    await fetchSpotify(envOf(DB), T1);
    const b = await spotifyStats(envOf(DB));
    expect(b).toMatchObject({ configured: true, last_ok: new Date(T1).toISOString(), last_error: '' });
    expect(b.episodes).toHaveLength(5);
    expect(b.episodes[0]).toEqual({ id: epId(0), name: '5 - Episode 5', published: '2026-11-01', starts: 0, streams: 100, listeners: 50 });
    expect(b.episodes.map((e: any) => e.published)).toEqual([...b.episodes.map((e: any) => e.published)].sort().reverse());
    const stats = await buildStats(envOf(DB), 30, T1);
    expect(stats).not.toHaveProperty('youtube');
    expect(stats.spotify).toEqual(b);
    expect(stats.platforms.series.some((r: any) => r.platform === 'spotify' && r.metric === 'streams')).toBe(true);
    noSecrets(JSON.stringify(stats));
    const all = JSON.stringify(sql.prepare('SELECT * FROM meta').all());
    noSecrets(all);
    noSecrets(logs.join('\n'));
  });
  it('stats block survives a missing sp_episodes table', async () => {
    const { DB, sql } = makeDb(); sql.exec('DROP TABLE sp_episodes');
    expect((await spotifyStats(envOf(DB))).episodes).toEqual([]);
  });
  it('top 300 by published', async () => {
    const { DB } = makeDb(); vi.stubGlobal('fetch', fakeSpotify({ eps: mkEps(400), first: '2026-11-01' }).fn);
    await fetchSpotify(envOf(DB), T1);
    const b = await spotifyStats(envOf(DB));
    expect(b.episodes.length).toBeLessThanOrEqual(300);
  });
});

describe('episode number matching (dashboard)', () => {
  const html = readFileSync(new URL('../../dashboard/index.html', import.meta.url), 'utf8');
  const m = /\/\* spmatch:start \*\/([\s\S]*?)\/\* spmatch:end \*\//.exec(html);
  it('has the marker block', () => expect(m).toBeTruthy());
  const lib = m ? (new Function(`${m[1]}; return { spEpisodeNumber, spStreamsByEpisode };`)() as any) : null;
  it.each([
    ['522 - Company brain', 522], ['#522 - x', 522], ['  #  41: Foo', 41], ['522. Foo', 522], ['טור #7 - פרק', null], ['Episode 522', null],
    ['2024 recap', null], ['12345 - way too long', null], ['', null], ['Rust 1.80 released', null],
  ])('%j -> %s', (name, n) => { expect(lib.spEpisodeNumber(name)).toBe(n); });
  it('joins by number and drops ambiguous numbers', () => {
    const map = lib.spStreamsByEpisode([
      { name: '522 - A', streams: 10 }, { name: '521 - B', streams: 5 }, { name: '#100 - C', streams: 1 }, { name: '100 - D', streams: 2 }, { name: 'Bonus', streams: 9 },
    ]);
    expect(map[522]).toBe(10); expect(map[521]).toBe(5);
    expect(100 in map).toBe(false);
    expect(Object.keys(map).sort()).toEqual(['521', '522']);
  });
});
