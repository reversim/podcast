// Hand-imported platform numbers (Apple, Spotify, ...). Stats host only, after auth.
import { addDays, utcDay } from './lib';
import type { Env } from './env';

export const PLATFORMS = ['apple', 'spotify', 'youtube', 'amazon', 'other'] as const;
export const MAX_ROWS = 5000;
export const MAX_BYTES = 512 * 1024;
export const CHUNK = 50;
const METRIC_RE = /^[a-z0-9_]{1,40}$/;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_DAY = '2008-01-01';

export interface PlatformRow { day: string; platform: string; metric: string; value: number }

/** Real calendar date in YYYY-MM-DD form. */
export function isRealDay(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = DAY_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Returns an error text, or null when the row is fine. */
export function rowError(r: unknown, now = Date.now()): string | null {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'row must be an object';
  const { day, platform, metric, value } = r as Record<string, unknown>;
  if (!isRealDay(day)) return 'day must be a real date in YYYY-MM-DD form';
  if (day < MIN_DAY) return `day must not be before ${MIN_DAY}`;
  if (day > addDays(utcDay(now), 1)) return 'day must not be in the future';
  if (typeof platform !== 'string' || !(PLATFORMS as readonly string[]).includes(platform)) {
    return `platform must be one of ${PLATFORMS.join(', ')}`;
  }
  if (typeof metric !== 'string' || !METRIC_RE.test(metric)) return 'metric must match ^[a-z0-9_]{1,40}$';
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1e12) {
    return 'value must be a number from 0 to less than 1e12';
  }
  return null;
}

export type Validated = { rows: PlatformRow[] } | { error: string; row?: number };

export function validateBody(body: unknown, now = Date.now()): Validated {
  const rows = body && typeof body === 'object' ? (body as { rows?: unknown }).rows : undefined;
  if (!Array.isArray(rows)) return { error: 'body must be {"rows":[...]}' };
  if (rows.length === 0) return { error: 'rows is empty' };
  if (rows.length > MAX_ROWS) return { error: `too many rows (max ${MAX_ROWS})` };
  for (let i = 0; i < rows.length; i++) {
    const e = rowError(rows[i], now);
    if (e) return { error: e, row: i };
  }
  return { rows: rows.map((r: PlatformRow) => ({ day: r.day, platform: r.platform, metric: r.metric, value: r.value })) };
}

/** Origin must equal the request's own origin. In DEV the host may come from x-dev-host. */
export function originOk(req: Request, env: Env): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  if (env.DEV === '1') {
    const host = req.headers.get('x-dev-host') ?? new URL(req.url).host;
    return origin === `https://${host}` || origin === `http://${host}` || origin === new URL(req.url).origin;
  }
  return origin === `https://${env.STATS_HOST.toLowerCase()}`;
}

const json = (obj: unknown, status: number) => Response.json(obj, { status, headers: { 'cache-control': 'no-store' } });

/** Handles /api/platform. Call only after authorize(). */
export async function handlePlatform(req: Request, env: Env, now = Date.now()): Promise<Response> {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST, DELETE' } });
  }
  if (!originOk(req, env)) return json({ error: 'bad origin' }, 403);

  if (req.method === 'DELETE') {
    const q = new URL(req.url).searchParams;
    const platform = q.get('platform') ?? '', metric = q.get('metric') ?? '', day = q.get('day');
    if (!(PLATFORMS as readonly string[]).includes(platform)) return json({ error: 'bad platform' }, 400);
    if (!METRIC_RE.test(metric)) return json({ error: 'bad metric' }, 400);
    if (day !== null && !isRealDay(day)) return json({ error: 'bad day' }, 400);
    const res = day === null
      ? await env.DB.prepare('DELETE FROM platform_stats WHERE platform = ?1 AND metric = ?2').bind(platform, metric).run()
      : await env.DB.prepare('DELETE FROM platform_stats WHERE platform = ?1 AND metric = ?2 AND day = ?3').bind(platform, metric, day).run();
    return json({ ok: true, deleted: res.meta?.changes ?? 0 }, 200);
  }

  if (!/^application\/json\s*(;|$)/i.test(req.headers.get('content-type') ?? '')) {
    return json({ error: 'content-type must be application/json' }, 403);
  }
  const len = Number(req.headers.get('content-length'));
  if (Number.isFinite(len) && len > MAX_BYTES) return json({ error: 'body too large (max 512 KB)' }, 413);
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return json({ error: 'body too large (max 512 KB)' }, 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json({ error: 'invalid JSON' }, 400); }
  const v = validateBody(body, now);
  if ('error' in v) return json(v, 400);

  const stmt = env.DB.prepare(
    `INSERT INTO platform_stats (platform, metric, day, value) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`);
  const stmts = v.rows.map((r) => stmt.bind(r.platform, r.metric, r.day, r.value));
  try {
    for (let i = 0; i < stmts.length; i += CHUNK) await env.DB.batch(stmts.slice(i, i + CHUNK));
  } catch (e) {
    console.error('platform write failed', e);
    return json({ error: 'database write failed' }, 500);
  }
  return json({ ok: true, rows: v.rows.length }, 200);
}

/** The `platforms` block of GET /api/stats. Never throws: a missing table gives empty arrays. */
export async function platformStats(env: Env) {
  const all = async <T>(sql: string) => (await env.DB.prepare(sql).all<T>()).results;
  return Promise.all([
    all(`SELECT platform, metric, day, value FROM platform_stats ORDER BY day, platform, metric LIMIT 20000`),
    all(`WITH r AS (SELECT platform, metric, day, value,
                      ROW_NUMBER() OVER (PARTITION BY platform, metric ORDER BY day DESC) AS rn FROM platform_stats)
         SELECT a.platform AS platform, a.metric AS metric, a.day AS day, a.value AS value,
                b.day AS prev_day, b.value AS prev_value
         FROM r a LEFT JOIN r b ON b.platform = a.platform AND b.metric = a.metric AND b.rn = 2
         WHERE a.rn = 1 ORDER BY a.platform, a.metric`),
  ]).then(([series, latest]) => ({ series, latest }))
    .catch((e) => { console.error('platform stats failed', e); return { series: [], latest: [] }; });
}
