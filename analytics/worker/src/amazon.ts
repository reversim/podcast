// Daily Amazon Music for Podcasters numbers. UNOFFICIAL: it reads the internal API of the web app at
// podcasters.amazon.com with the owner's browser session cookies. Amazon has no public API for this and can
// change or block it any time. The request shapes come from the public script of the web app (2026-11-16).
//
// Flow (3 fetches per run):
//   1. GET /auth/csrf?path=... with the cookies. The answer is a redirect whose Location holds `csrf-token=...`.
//      A redirect without the token (for example to a sign-in page) means the cookies have expired.
//   2. POST /api/metrics/podcast, daily time series for the last 30 days (starts, plays, listeners, engaged listeners).
//   3. POST /api/metrics/podcast, totals for a long period: the number of followers.
// The CSRF token lives only in memory inside one run. Cookies and token are never stored or logged.
// Never throws: every failure is a result. Rows go to platform_stats as platform "amazon".
import { addDays, utcDay } from './lib';
import type { Env } from './env';

const ORIGIN = 'https://podcasters.amazon.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
export const AMZ_EXPIRED = 'Amazon session expired: renew the cookies';
export const AMZ_NOT_CONFIGURED = 'Amazon is not configured: set AMAZON_PODCAST_ID and AMAZON_COOKIE';
export const AMZ_WINDOW_DAYS = 30;
const FOLLOWERS_SINCE = '2020-01-01T00:00:00.000Z'; // before the start of Amazon Music podcasts
const START_HOUR = 5;
const MAX_ATTEMPTS_PER_DAY = 4;
/** Amazon series name -> our metric name. */
const SERIES: Record<string, string> = {
  startsTimeSeries: 'starts', playsTimeSeries: 'plays', listenersTimeSeries: 'listeners', engagedListenersTimeSeries: 'engaged_listeners',
};

export interface AmzOk { ok: true; days_written: number; followers: number | null; subrequests: number }
export interface AmzFail { ok: false; error: string }
export type AmzResult = AmzOk | AmzFail;
export interface AmzRow { m: string; d: string; v: number }

export const amazonConfigured = (env: Env) => Boolean(env.AMAZON_PODCAST_ID && env.AMAZON_COOKIE);

/** Removes the cookie values and the CSRF token from any text. */
export function redactAmazon(text: string, env: Env, extra: string[] = []): string {
  let out = String(text);
  const secrets = [...extra, env.AMAZON_COOKIE ?? '', ...(env.AMAZON_COOKIE ?? '').split(';').map((p) => p.slice(p.indexOf('=') + 1).trim())];
  for (const s of secrets) if (s && s.length >= 6) out = out.split(s).join('REDACTED');
  return out.replace(/(csrf-token["']?\s*[=:]\s*["']?)[^&\s"'<>;,}]+/gi, '$1REDACTED');
}

class AmzError extends Error {
  constructor(msg: string, public expired = false) { super(msg); }
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e12 ? v : null);

/** Reads the daily series of the reply. Keeps days from `start` to `end`. Drops a series that is all zero. */
export function seriesRows(data: any, start: string, end: string): AmzRow[] {
  const out: AmzRow[] = [];
  for (const [key, metric] of Object.entries(SERIES)) {
    const list = Array.isArray(data?.[key]) ? data[key] : [];
    const rows: AmzRow[] = [];
    for (const p of list) {
      const d = typeof p?.time === 'string' ? p.time.slice(0, 10) : '';
      const v = num(p?.value);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d >= start && d <= end && v !== null) rows.push({ m: metric, d, v });
    }
    if (rows.some((r) => r.v > 0)) out.push(...rows);
  }
  return out;
}

async function csrfToken(env: Env): Promise<string> {
  const res = await fetch(`${ORIGIN}/auth/csrf?path=${ORIGIN}/podcasts`, {
    method: 'GET', redirect: 'manual', headers: { cookie: env.AMAZON_COOKIE as string, 'user-agent': UA },
  });
  const loc = res.headers.get('location') ?? '';
  let token: string | null = null;
  try { token = new URL(loc, ORIGIN).searchParams.get('csrf-token'); } catch { /* bad Location: no token */ }
  if (token) return token.replace(/ /g, '+');
  if ((res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403) throw new AmzError(AMZ_EXPIRED, true);
  throw new AmzError(`Amazon CSRF request failed with HTTP ${res.status}`);
}

async function metrics(env: Env, token: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${ORIGIN}/api/metrics/podcast`, {
    method: 'POST',
    headers: { cookie: env.AMAZON_COOKIE as string, 'content-type': 'application/json', 'csrf-token': token, locale: 'en-US', 'user-agent': UA },
    body: JSON.stringify({ podcastIds: [(env.AMAZON_PODCAST_ID as string).trim()], ...body }),
  });
  if (res.status === 401 || res.status === 403) throw new AmzError(AMZ_EXPIRED, true);
  if (!res.ok) throw new AmzError(`Amazon metrics request failed with HTTP ${res.status}`);
  let j: any;
  try { j = await res.json(); } catch { throw new AmzError('Amazon metrics reply is not JSON'); }
  if (!j || typeof j.data !== 'object' || j.data === null) throw new AmzError('Amazon metrics reply has no data');
  return j.data;
}

const UPSERT_PLATFORM = `INSERT INTO platform_stats (platform, metric, day, value)
  SELECT 'amazon', json_extract(value, '$.m'), json_extract(value, '$.d'), json_extract(value, '$.v') FROM json_each(?1) WHERE true
  ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`;
const UPSERT_META = `INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
const DELETE_META = `DELETE FROM meta WHERE key = ?1`;
const getMeta = async (env: Env, key: string) =>
  (await env.DB.prepare(`SELECT value FROM meta WHERE key = ?1`).bind(key).first<{ value: string }>())?.value ?? '';

/** Fetches Amazon now and stores the numbers. Never throws. */
export async function fetchAmazon(env: Env, now = Date.now()): Promise<AmzResult> {
  if (!amazonConfigured(env)) return { ok: false, error: AMZ_NOT_CONFIGURED };
  if (!/^[0-9a-f-]{36}$/i.test((env.AMAZON_PODCAST_ID as string).trim())) return { ok: false, error: 'AMAZON_PODCAST_ID looks wrong: use the id in the podcasters.amazon.com address' };
  const today = utcDay(now), yesterday = addDays(today, -1), start = addDays(yesterday, -(AMZ_WINDOW_DAYS - 1));
  const secrets: string[] = [];
  try {
    const token = await csrfToken(env);
    secrets.push(token);
    const calc = { calculationsIncluded: ['TOTAL'] };
    const day = { granularity: 'DAY' };
    const data = await metrics(env, token, {
      startTime: `${start}T00:00:00.000Z`, endTime: new Date(now).toISOString(),
      startsTimeSeries: day, playsTimeSeries: day, listenersTimeSeries: day, engagedListenersTimeSeries: day,
    });
    const totals = await metrics(env, token, { startTime: FOLLOWERS_SINCE, endTime: new Date(now).toISOString(), followsTotals: calc });
    const rows = seriesRows(data, start, yesterday);
    const followers = num(totals?.followsTotals?.total);
    if (followers !== null) rows.push({ m: 'followers', d: today, v: followers });
    const stmts = [];
    for (let i = 0; i < rows.length; i += 100) stmts.push(env.DB.prepare(UPSERT_PLATFORM).bind(JSON.stringify(rows.slice(i, i + 100))));
    stmts.push(
      env.DB.prepare(UPSERT_META).bind('amazon_day', today),
      env.DB.prepare(UPSERT_META).bind('amazon_last_ok', new Date(now).toISOString()),
      env.DB.prepare(DELETE_META).bind('amazon_last_error'),
    );
    await env.DB.batch(stmts);
    return { ok: true, days_written: new Set(rows.map((r) => r.d)).size, followers, subrequests: 3 };
  } catch (e) {
    const msg = redactAmazon(e instanceof Error ? e.message : String(e), env, secrets).slice(0, 200);
    console.error('amazon fetch failed: ' + msg);
    try {
      const stmts = [env.DB.prepare(UPSERT_META).bind('amazon_last_error', `${msg} (${new Date(now).toISOString()})`)];
      // Expired cookies will not fix themselves: stop the hourly retries for today (the refresh endpoint still works).
      if (e instanceof AmzError && e.expired) stmts.push(env.DB.prepare(UPSERT_META).bind('amazon_day', today));
      await env.DB.batch(stmts);
    } catch { /* the status write is best effort */ }
    return { ok: false, error: msg };
  }
}

/** Called from the hourly cron. Runs once per UTC day from 05:00; retries hourly after a failure (max 4 tries a day). Never throws. */
export async function runDailyAmazon(env: Env, now = Date.now()): Promise<void> {
  try {
    if (!amazonConfigured(env)) return;
    if (new Date(now).getUTCHours() < START_HOUR) return;
    const day = utcDay(now);
    if ((await getMeta(env, 'amazon_day')) === day) return;
    const [ad, an] = (await getMeta(env, 'amazon_attempts')).split(':');
    const tries = ad === day ? Number(an) || 0 : 0;
    if (tries >= MAX_ATTEMPTS_PER_DAY) return;
    await env.DB.prepare(UPSERT_META).bind('amazon_attempts', `${day}:${tries + 1}`).run();
    await fetchAmazon(env, now);
  } catch (e) {
    console.error('amazon schedule failed: ' + redactAmazon(String((e as Error)?.message ?? e), env));
  }
}

/** POST /api/amazon/refresh. Call only after authorize() and the origin check. */
export async function handleAmazonRefresh(env: Env, now = Date.now()): Promise<Response> {
  const r = await fetchAmazon(env, now);
  const status = r.ok ? 200 : r.error === AMZ_NOT_CONFIGURED ? 400 : 502;
  return Response.json(r, { status, headers: { 'cache-control': 'no-store' } });
}

/** The `amazon` block of GET /api/stats. Never throws. */
export async function amazonStats(env: Env) {
  const out = { configured: amazonConfigured(env), last_ok: '', last_error: '' };
  try {
    const m = await env.DB.prepare(`SELECT key, value FROM meta WHERE key IN ('amazon_last_ok', 'amazon_last_error')`).all<{ key: string; value: string }>();
    for (const r of m.results) {
      if (r.key === 'amazon_last_ok') out.last_ok = r.value;
      else out.last_error = redactAmazon(r.value, env);
    }
  } catch (e) { console.error('amazon status failed'); }
  return out;
}
