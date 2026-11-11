// Daily Spotify for Creators numbers. UNOFFICIAL: it reads the internal API of the Spotify for Creators web app
// with the owner's browser session cookies (sp_dc, sp_key), the same way the open-source Open Podcast project does:
// https://github.com/openpodcast/spotify-connector (spotifyconnector/connector.py, MIT). Spotify can change or block it any time.
//
// Auth (PKCE, as in the connector):
//   1. GET accounts.spotify.com/oauth2/v2/auth?response_mode=web_message&prompt=none... with Cookie sp_dc + sp_key.
//      The answer is an HTML page with `const authorizationResponse = {...};` that holds a one-time code.
//      `login_required` in it (or 401/403, or a redirect to a login page) means the cookies have expired.
//   2. POST accounts.spotify.com/api/token (authorization_code + code_verifier) gives a bearer token, valid 1 hour.
// The token lives only in memory inside one run (a run takes seconds). It is never stored or logged.
//
// Budget: at most MAX_SUBREQUESTS (40) fetches per run (free plan limit is 50). Never throws: every failure is a result.
// D1 writes use json_each, so one statement carries up to 100 rows, and batches hold at most 50 statements.
import { addDays, utcDay } from './lib';
import type { Env } from './env';

export const BASE_URL = 'https://generic.wg.spotify.com/podcasters/v0';
export const DEFAULT_CLIENT_ID = '05a1371ee5194c27860b3ff3ff3979d2'; // the Creators web app; static for everyone (connector README)
const AUTH_URL = 'https://accounts.spotify.com/oauth2/v2/auth';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const REDIRECT_URI = 'https://podcasters.spotify.com';
const SCOPE = 'streaming ugc-image-upload user-read-email user-read-private';

export const MAX_SUBREQUESTS = 40;
export const EXPIRED = 'Spotify session expired: renew the cookies';
export const NOT_CONFIGURED = 'Spotify is not configured: set SPOTIFY_SHOW_ID, SPOTIFY_SP_DC and SPOTIFY_SP_KEY';
export const WINDOW_DAYS = 30;
const BACKFILL_CHUNK = 365;
const BACKFILL_FLOOR = '2015-05-01'; // the connector's own "oldest date"
const START_HOUR = 4;
const MAX_ATTEMPTS_PER_DAY = 4;
const LIST_SIZE = 50;
const MAX_LIST_PAGES = 14;
const MAX_EPISODE_CALLS = 20;
const PER_STMT = 100;
const BATCH = 50;

export interface SpOk { ok: true; days_written: number; episodes_written: number; subrequests: number; warning?: string }
export interface SpFail { ok: false; error: string }
export type SpResult = SpOk | SpFail;

export const spotifyConfigured = (env: Env) => Boolean(env.SPOTIFY_SHOW_ID && env.SPOTIFY_SP_DC && env.SPOTIFY_SP_KEY);

const secretsOf = (env: Env, extra: (string | undefined)[] = []) =>
  [env.SPOTIFY_SP_DC, env.SPOTIFY_SP_KEY, ...extra].filter((s): s is string => typeof s === 'string' && s.length >= 4);

/** Removes cookies, tokens and codes from any text: the exact secrets, and common key=value / JSON shapes. */
export function redact(text: string, secrets: (string | undefined)[] = []): string {
  let out = String(text);
  for (const s of secrets) if (s && s.length >= 4) out = out.split(s).join('REDACTED');
  out = out.replace(/\b(sp_dc|sp_key|code_verifier|code|access_token|refresh_token|state)(["']?\s*[=:]\s*["']?)[^&\s"'<>;,}]+/gi, '$1$2REDACTED')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1REDACTED');
  return out;
}

class SpError extends Error {
  constructor(msg: string, public expired = false, public fatal = false) { super(msg); }
}

/** Counts every fetch. The run stops with an error when the cap is reached. */
export class Budget {
  n = 0;
  constructor(public max = MAX_SUBREQUESTS) {}
  left() { return this.max - this.n; }
  take() { if (this.n >= this.max) throw new SpError(`subrequest cap reached (${this.max})`); this.n++; }
}

// ---- PKCE ----
const ALNUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export function randomString(len: number): string {
  const b = new Uint8Array(len); crypto.getRandomValues(b);
  let s = ''; for (const x of b) s += ALNUM[x % ALNUM.length];
  return s;
}
export function b64url(buf: ArrayBuffer): string {
  let bin = ''; for (const x of new Uint8Array(buf)) bin += String.fromCharCode(x);
  return btoa(bin).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
}
export async function codeChallenge(verifier: string): Promise<string> {
  return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
}

/** Reads {code,state} out of the web_message page. The object is JS-like (may lack quotes), so JSON first, then patterns. */
export function parseAuthPage(html: string): { code?: string; state?: string; error?: string } {
  const m = /const authorizationResponse = ([\s\S]*?);/.exec(html);
  if (!m) return {};
  const raw = m[1];
  try {
    const j = JSON.parse(raw);
    const r = j?.response ?? j;
    return { code: typeof r?.code === 'string' ? r.code : undefined, state: typeof r?.state === 'string' ? r.state : undefined, error: typeof r?.error === 'string' ? r.error : undefined };
  } catch { /* not strict JSON: use patterns */ }
  const pick = (k: string) => new RegExp(`["']?${k}["']?\\s*:\\s*["']?([^"',}\\s]+)`).exec(raw)?.[1];
  return { code: pick('code'), state: pick('state'), error: pick('error') };
}

const isSpotifyHost = (h: string) => h === 'spotify.com' || h.endsWith('.spotify.com');

async function sfetch(budget: Budget, url: string, init: RequestInit, secrets: string[]): Promise<Response> {
  budget.take();
  try { return await fetch(url, init); } catch (e) {
    throw new SpError('network error: ' + redact(String((e as Error)?.message ?? e), secrets));
  }
}

const httpFail = (what: string, status: number) =>
  new SpError(status === 429 ? `Spotify rate limit (429) at ${what}` : `Spotify ${what} failed with HTTP ${status}`, false, status === 429);

/** Gets a bearer token from the cookies. Throws SpError (expired=true when the cookies are no longer valid). */
export async function authenticate(budget: Budget, env: Env): Promise<string> {
  const dc = env.SPOTIFY_SP_DC as string, key = env.SPOTIFY_SP_KEY as string;
  const clientId = env.SPOTIFY_CLIENT_ID || DEFAULT_CLIENT_ID;
  const secrets = secretsOf(env);
  const state = randomString(32), verifier = randomString(64);
  const challenge = await codeChallenge(verifier);
  let url = AUTH_URL + '?' + new URLSearchParams({
    response_type: 'code', client_id: clientId, scope: SCOPE, redirect_uri: REDIRECT_URI,
    code_challenge: challenge, code_challenge_method: 'S256', state, response_mode: 'web_message', prompt: 'none',
  }).toString();
  const cookie = `sp_dc=${dc}; sp_key=${key}`;

  let res: Response | null = null;
  for (let hop = 0; hop < 4; hop++) {
    res = await sfetch(budget, url, { method: 'GET', redirect: 'manual', headers: { cookie, accept: 'text/html' } }, secrets);
    if (res.status < 300 || res.status >= 400) break;
    const loc = res.headers.get('location') ?? '';
    let next: URL;
    try { next = new URL(loc, url); } catch { throw new SpError('Spotify auth: bad redirect'); }
    if (/login|signin/i.test(next.pathname) || /[?&]error=login_required/.test(next.search)) throw new SpError(EXPIRED, true);
    // A redirect that already carries the code (redirect_uri flavour of the flow).
    const rc = next.searchParams.get('code');
    if (rc && next.searchParams.get('state') === state) return exchange(budget, clientId, rc, verifier, secrets);
    if (!isSpotifyHost(next.hostname)) throw new SpError('Spotify auth: unexpected redirect to another host');
    url = next.toString(); // cookies only ever go to *.spotify.com (checked above)
  }
  if (!res || (res.status >= 300 && res.status < 400)) throw new SpError('Spotify auth: too many redirects');
  if (res.status === 401 || res.status === 403) throw new SpError(EXPIRED, true);
  if (!res.ok) throw httpFail('auth page', res.status);
  const html = await res.text();
  if (html.includes('login_required')) throw new SpError(EXPIRED, true);
  const a = parseAuthPage(html);
  if (a.error) throw new SpError(`Spotify auth refused: ${redact(a.error, secrets).slice(0, 60)}`, /login|consent|interaction/i.test(a.error));
  if (!a.code) throw new SpError('Spotify auth page has no authorization code (Spotify may have changed the login flow)');
  if (a.state !== state) throw new SpError('Spotify auth: state mismatch');
  return exchange(budget, clientId, a.code, verifier, secrets.concat(a.code));
}

async function exchange(budget: Budget, clientId: string, code: string, verifier: string, secrets: string[]): Promise<string> {
  const res = await sfetch(budget, TOKEN_URL, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, code, redirect_uri: REDIRECT_URI, code_verifier: verifier }).toString(),
  }, secrets);
  if (res.status === 401 || res.status === 403) throw new SpError(EXPIRED, true);
  if (!res.ok) throw httpFail('token request', res.status);
  let j: any = null;
  try { j = await res.json(); } catch { /* handled below */ }
  const tok = j?.access_token;
  if (typeof tok !== 'string' || !tok) throw new SpError('Spotify token response has no access_token');
  return tok;
}

/** GET one internal API endpoint. Returns parsed JSON. */
async function api(budget: Budget, token: string, path: string, params: Record<string, string | number>, secrets: string[]): Promise<any> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const res = await sfetch(budget, `${BASE_URL}/${path}${qs ? '?' + qs : ''}`, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } }, secrets);
  if (res.status === 401) throw new SpError('Spotify API rejected the token (401)');
  if (res.status === 403) throw new SpError('Spotify API refused access (403): check SPOTIFY_SHOW_ID and that this login owns the show');
  if (!res.ok) throw httpFail(path.replace(/\/[A-Za-z0-9]{22}(?=\/|$)/g, '/<id>'), res.status);
  try { return await res.json(); } catch { throw new SpError(`Spotify API ${path.replace(/\/[A-Za-z0-9]{22}(?=\/|$)/g, '/<id>')}: response is not JSON`); }
}

// ---- parsing ----
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e12 ? v : null);

export interface Row { m: string; d: string; v: number }

/** followers / listeners: {counts:[{date,count}]}. */
export function countRows(metric: string, body: any): Row[] {
  const out: Row[] = [];
  for (const c of Array.isArray(body?.counts) ? body.counts : []) {
    const v = num(c?.count);
    if (typeof c?.date === 'string' && DAY.test(c.date) && v != null) out.push({ m: metric, d: c.date, v });
  }
  return out;
}

/** detailedStreams: {detailedStreams:[{date,starts,streams}]}. Spotify removed "starts" in May 2025: skip the series if it is all zero or missing. */
export function streamRows(body: any): Row[] {
  const out: Row[] = [], starts: Row[] = [];
  for (const c of Array.isArray(body?.detailedStreams) ? body.detailedStreams : []) {
    if (typeof c?.date !== 'string' || !DAY.test(c.date)) continue;
    const s = num(c?.streams), st = num(c?.starts);
    if (s != null) out.push({ m: 'streams', d: c.date, v: s });
    if (st != null) starts.push({ m: 'starts', d: c.date, v: st });
  }
  return starts.some((r) => r.v > 0) ? out.concat(starts) : out;
}

export interface Ep { id: string; name: string; published: string; starts: number | null; streams: number | null; listeners: number | null }

export function episodeOf(e: any): Ep | null {
  const id = typeof e?.id === 'string' && /^[A-Za-z0-9]{10,30}$/.test(e.id) ? e.id : '';
  if (!id) return null;
  return { id, name: String(e?.name ?? '').slice(0, 300), published: typeof e?.releaseDate === 'string' ? e.releaseDate.slice(0, 10) : '',
    starts: num(e?.starts), streams: num(e?.streams), listeners: num(e?.listeners) };
}

// ---- storage ----
const UPSERT_PLATFORM = `INSERT INTO platform_stats (platform, metric, day, value)
  SELECT 'spotify', json_extract(value, '$.m'), json_extract(value, '$.d'), json_extract(value, '$.v') FROM json_each(?1) WHERE true
  ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`;
const UPSERT_META = `INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
const DELETE_META = `DELETE FROM meta WHERE key = ?1`;
const CREATE_EPISODES = `CREATE TABLE IF NOT EXISTS sp_episodes (
  episode_id TEXT PRIMARY KEY, name TEXT, published TEXT,
  starts INTEGER, streams INTEGER, listeners INTEGER, updated_day TEXT) WITHOUT ROWID`;
const UPSERT_EPISODES = `INSERT INTO sp_episodes (episode_id, name, published, starts, streams, listeners, updated_day)
  SELECT json_extract(value, '$.i'), json_extract(value, '$.n'), json_extract(value, '$.p'), json_extract(value, '$.s'), json_extract(value, '$.t'), json_extract(value, '$.l'), ?2
  FROM json_each(?1) WHERE true
  ON CONFLICT (episode_id) DO UPDATE SET name = excluded.name, published = excluded.published,
    starts = excluded.starts, streams = excluded.streams, listeners = excluded.listeners, updated_day = excluded.updated_day`;
// Names and dates only (the list gave no usable totals): keep the stored totals.
const UPSERT_EPISODE_NAMES = `INSERT INTO sp_episodes (episode_id, name, published, updated_day)
  SELECT json_extract(value, '$.i'), json_extract(value, '$.n'), json_extract(value, '$.p'), NULL FROM json_each(?1) WHERE true
  ON CONFLICT (episode_id) DO UPDATE SET name = excluded.name, published = excluded.published`;

const chunks = <T>(a: T[], n: number) => { const o: T[][] = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

async function writeStatements(env: Env, stmts: D1PreparedStatement[]) {
  for (const c of chunks(stmts, BATCH)) await env.DB.batch(c);
}

async function writeRows(env: Env, rows: Row[]): Promise<number> {
  if (!rows.length) return 0;
  await writeStatements(env, chunks(rows, PER_STMT).map((c) => env.DB.prepare(UPSERT_PLATFORM).bind(JSON.stringify(c))));
  return new Set(rows.map((r) => r.d)).size;
}

const getMeta = async (env: Env, key: string) =>
  (await env.DB.prepare(`SELECT value FROM meta WHERE key = ?1`).bind(key).first<{ value: string }>())?.value ?? '';

// ---- the run ----
async function series(budget: Budget, token: string, showId: string, start: string, end: string, secrets: string[]): Promise<Row[]> {
  const p = { start, end };
  const [f, l, s] = [
    await api(budget, token, `shows/${showId}/followers`, p, secrets),
    await api(budget, token, `shows/${showId}/listeners`, p, secrets),
    await api(budget, token, `shows/${showId}/detailedStreams`, p, secrets),
  ];
  return [...countRows('followers', f), ...countRows('listeners', l), ...streamRows(s)];
}

async function listEpisodes(budget: Budget, token: string, showId: string, today: string, secrets: string[]): Promise<Ep[]> {
  const out: Ep[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    if (budget.left() < 1) break;
    const r = await api(budget, token, `shows/${showId}/episodes`,
      { start: BACKFILL_FLOOR, end: today, page, size: LIST_SIZE, sortBy: 'releaseDate', sortOrder: 'descending', filter: '' }, secrets);
    for (const e of Array.isArray(r?.episodes) ? r.episodes : []) { const x = episodeOf(e); if (x) out.push(x); }
    const total = Number(r?.totalPages);
    if (!Number.isFinite(total) || page >= total) break;
  }
  return out;
}

/** Stores the episode list. Returns rows written. When the list carries no totals, rotates per-episode metadata calls. */
async function storeEpisodes(env: Env, budget: Budget, token: string, eps: Ep[], day: string, secrets: string[]): Promise<number> {
  await env.DB.prepare(CREATE_EPISODES).run();
  const have = (await env.DB.prepare(`SELECT episode_id AS id, name, published, starts, streams, listeners, updated_day AS upd FROM sp_episodes`)
    .all<{ id: string; name: string; published: string; starts: number | null; streams: number | null; listeners: number | null; upd: string | null }>()).results;
  const old = new Map(have.map((r) => [r.id, r]));
  const hasTotals = eps.some((e) => (e.streams ?? 0) > 0 || (e.listeners ?? 0) > 0);
  const toJson = (e: Ep) => ({ i: e.id, n: e.name, p: e.published, s: e.starts, t: e.streams, l: e.listeners });
  const stmts: D1PreparedStatement[] = [];
  let written = 0;

  if (hasTotals) {
    const changed = eps.filter((e) => {
      const o = old.get(e.id);
      return !o || o.name !== e.name || o.published !== e.published || o.starts !== e.starts || o.streams !== e.streams || o.listeners !== e.listeners;
    });
    for (const c of chunks(changed, PER_STMT)) stmts.push(env.DB.prepare(UPSERT_EPISODES).bind(JSON.stringify(c.map(toJson)), day));
    written = changed.length;
  } else {
    // The list has no totals (Spotify moved them to the per-episode metadata, issue openpodcast/spotify-connector#22).
    const names = eps.filter((e) => { const o = old.get(e.id); return !o || o.name !== e.name || o.published !== e.published; });
    for (const c of chunks(names, PER_STMT)) stmts.push(env.DB.prepare(UPSERT_EPISODE_NAMES).bind(JSON.stringify(c.map((e) => ({ i: e.id, n: e.name, p: e.published })))));
    // Never fetched first (newest first), then the oldest updated_day. At most 20 calls and never beyond the cap.
    const rank = (e: Ep) => old.get(e.id)?.upd ?? '';
    const order = eps.slice().sort((a, b) => (rank(a) < rank(b) ? -1 : rank(a) > rank(b) ? 1 : (a.published < b.published ? 1 : a.published > b.published ? -1 : 0)));
    const got: Ep[] = [];
    for (const e of order.slice(0, Math.min(MAX_EPISODE_CALLS, Math.max(0, budget.left())))) {
      const m = await api(budget, token, `episodes/${e.id}/metadata`, {}, secrets);
      got.push({ ...e, starts: num(m?.starts), streams: num(m?.streams), listeners: num(m?.listeners) });
    }
    for (const c of chunks(got, PER_STMT)) stmts.push(env.DB.prepare(UPSERT_EPISODES).bind(JSON.stringify(c.map(toJson)), day));
    written = names.length + got.length;
  }
  await writeStatements(env, stmts);
  return written;
}

/** Walks back in 365-day chunks from just before the 30-day window. Resumes on later days through meta.spotify_backfill. */
async function backfill(env: Env, budget: Budget, token: string, showId: string, windowStart: string, secrets: string[]): Promise<{ days: number; note?: string }> {
  let next = await getMeta(env, 'spotify_backfill');
  if (next === 'done') return { days: 0 };
  let end = next && DAY.test(next) ? addDays(next, -1) : addDays(windowStart, -1);
  let days = 0;
  while (budget.left() >= 3) {
    if (end < BACKFILL_FLOOR) { await env.DB.prepare(UPSERT_META).bind('spotify_backfill', 'done').run(); return { days }; }
    const start = addDays(end, -(BACKFILL_CHUNK - 1)) < BACKFILL_FLOOR ? BACKFILL_FLOOR : addDays(end, -(BACKFILL_CHUNK - 1));
    let rows: Row[];
    try { rows = await series(budget, token, showId, start, end, secrets); } catch (e) {
      // A 4xx for a range means Spotify does not hold data that far back (or rejects the range): stop for good.
      if (e instanceof SpError && !e.fatal && /HTTP 4\d\d/.test(e.message)) {
        await env.DB.prepare(UPSERT_META).bind('spotify_backfill', 'done').run();
        return { days, note: 'backfill stopped: ' + e.message };
      }
      throw e;
    }
    const nonzero = rows.some((r) => r.v > 0);
    if (nonzero) days += await writeRows(env, rows);
    if (!nonzero) { await env.DB.prepare(UPSERT_META).bind('spotify_backfill', 'done').run(); return { days }; }
    await env.DB.prepare(UPSERT_META).bind('spotify_backfill', start).run();
    end = addDays(start, -1);
  }
  return { days };
}

async function recordFailure(env: Env, msg: string, now: number) {
  try {
    await env.DB.prepare(UPSERT_META).bind('spotify_last_error', `${msg} (${new Date(now).toISOString()})`).run();
  } catch (e) { console.error('spotify status write failed: ' + redact(String((e as Error)?.message ?? e), secretsOf(env))); }
}

/** Fetches Spotify now and stores the numbers. Never throws. */
export async function fetchSpotify(env: Env, now = Date.now()): Promise<SpResult> {
  if (!spotifyConfigured(env)) return { ok: false, error: NOT_CONFIGURED };
  const budget = new Budget();
  const secrets = secretsOf(env);
  const showId = (env.SPOTIFY_SHOW_ID as string).trim();
  if (!/^[A-Za-z0-9]{10,30}$/.test(showId)) return { ok: false, error: 'SPOTIFY_SHOW_ID looks wrong: use the part after open.spotify.com/show/' };
  const today = utcDay(now), yesterday = addDays(today, -1), windowStart = addDays(yesterday, -(WINDOW_DAYS - 1));
  const day = today;
  try {
    const token = await authenticate(budget, env);
    secrets.push(token);
    const rows = await series(budget, token, showId, windowStart, yesterday, secrets);
    if (!rows.length) throw new SpError('Spotify returned no data for the last 30 days');
    let days = await writeRows(env, rows);
    let episodes = 0;
    const warnings: string[] = [];
    try {
      const eps = await listEpisodes(budget, token, showId, today, secrets);
      if (eps.length) episodes = await storeEpisodes(env, budget, token, eps, day, secrets);
      else warnings.push('episodes: Spotify returned an empty list');
    } catch (e) { warnings.push('episodes: ' + redact(e instanceof Error ? e.message : String(e), secrets)); }
    try {
      const b = await backfill(env, budget, token, showId, windowStart, secrets);
      days += b.days;
      if (b.note) warnings.push(b.note);
    } catch (e) { warnings.push('backfill: ' + redact(e instanceof Error ? e.message : String(e), secrets)); }
    const warning = warnings.join('; ').slice(0, 300) || undefined;
    const stmts = [
      env.DB.prepare(UPSERT_META).bind('spotify_day', day),
      env.DB.prepare(UPSERT_META).bind('spotify_last_ok', new Date(now).toISOString()),
      warning ? env.DB.prepare(UPSERT_META).bind('spotify_last_error', `${warning} (${new Date(now).toISOString()})`) : env.DB.prepare(DELETE_META).bind('spotify_last_error'),
    ];
    await env.DB.batch(stmts);
    const out: SpOk = { ok: true, days_written: days, episodes_written: episodes, subrequests: budget.n };
    if (warning) out.warning = warning;
    return out;
  } catch (e) {
    const err = e instanceof SpError ? e : null;
    const msg = redact(e instanceof Error ? e.message : String(e), secrets).slice(0, 200);
    console.error('spotify fetch failed: ' + msg);
    await recordFailure(env, msg, now);
    // Expired cookies will not fix themselves: stop the hourly retries for today (the refresh button still works).
    if (err?.expired) { try { await env.DB.prepare(UPSERT_META).bind('spotify_day', day).run(); } catch { /* ignore */ } }
    return { ok: false, error: msg };
  }
}

/** Called from the hourly cron. Runs once per UTC day from 04:00; retries hourly after a failure (max 4 tries a day). Never throws. */
export async function runDailySpotify(env: Env, now = Date.now()): Promise<void> {
  try {
    if (!spotifyConfigured(env)) return;
    if (new Date(now).getUTCHours() < START_HOUR) return;
    const day = utcDay(now);
    if ((await getMeta(env, 'spotify_day')) === day) return;
    const att = await getMeta(env, 'spotify_attempts');
    const [ad, an] = att.split(':');
    const tries = ad === day ? Number(an) || 0 : 0;
    if (tries >= MAX_ATTEMPTS_PER_DAY) return;
    await env.DB.prepare(UPSERT_META).bind('spotify_attempts', `${day}:${tries + 1}`).run();
    await fetchSpotify(env, now);
  } catch (e) {
    console.error('spotify schedule failed: ' + redact(String((e as Error)?.message ?? e), secretsOf(env)));
  }
}

/** POST /api/spotify/refresh. Call only after authorize() and the origin check. */
export async function handleSpotifyRefresh(env: Env, now = Date.now()): Promise<Response> {
  const r = await fetchSpotify(env, now);
  const status = r.ok ? 200 : r.error === NOT_CONFIGURED ? 400 : 502;
  return Response.json(r, { status, headers: { 'cache-control': 'no-store' } });
}

/** The `spotify` block of GET /api/stats. Never throws. */
export async function spotifyStats(env: Env) {
  const out = { configured: spotifyConfigured(env), last_ok: '', last_error: '', episodes: [] as unknown[] };
  try {
    const m = await env.DB.prepare(`SELECT key, value FROM meta WHERE key IN ('spotify_last_ok', 'spotify_last_error')`).all<{ key: string; value: string }>();
    for (const r of m.results) {
      if (r.key === 'spotify_last_ok') out.last_ok = r.value;
      else out.last_error = redact(r.value, secretsOf(env));
    }
  } catch (e) { console.error('spotify status failed: ' + redact(String((e as Error)?.message ?? e), secretsOf(env))); }
  try {
    const r = await env.DB.prepare(
      `SELECT episode_id AS id, name, published, starts, streams, listeners FROM sp_episodes
       WHERE streams IS NOT NULL OR listeners IS NOT NULL OR starts IS NOT NULL
       ORDER BY published DESC, episode_id LIMIT 300`).all<{ id: string; name: string | null; published: string | null; starts: number | null; streams: number | null; listeners: number | null }>();
    out.episodes = r.results.map((x) => ({ id: x.id, name: x.name ?? '', published: x.published ?? '', starts: x.starts ?? 0, streams: x.streams ?? 0, listeners: x.listeners ?? 0 }));
  } catch (e) {
    // The table may not exist yet (schema.sql not applied and no run so far).
    out.episodes = [];
  }
  return out;
}
