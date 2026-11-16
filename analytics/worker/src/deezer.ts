// Daily Deezer fan count (the followers of the show). Source: the public Deezer API, no login:
// GET https://api.deezer.com/podcast/<id> -> {"id":..., "fans": N, ...}. Deezer has no API for stream counts.
// One fetch per day. Never throws. The row goes to platform_stats as ('deezer', 'followers', today).
import { utcDay } from './lib';
import type { Env } from './env';

const START_HOUR = 5;
const MAX_ATTEMPTS_PER_DAY = 4;
const UPSERT_META = `INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;

export type DzResult = { ok: true; followers: number } | { ok: false; error: string };

/** Reads the fan count from the API reply. The API reports errors as HTTP 200 with {"error":{...}}. */
export function fansOf(body: any): number | null {
  const v = body?.fans;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e12 ? v : null;
}

/** Fetches the fan count now and stores it. Never throws. */
export async function fetchDeezer(env: Env, now = Date.now()): Promise<DzResult> {
  const id = (env.DEEZER_SHOW_ID ?? '').trim();
  if (!/^\d{1,20}$/.test(id)) return { ok: false, error: 'Deezer is not configured: set DEEZER_SHOW_ID' };
  const today = utcDay(now);
  try {
    const res = await fetch(`https://api.deezer.com/podcast/${id}`, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`Deezer request failed with HTTP ${res.status}`);
    const body: any = await res.json();
    const fans = fansOf(body);
    if (fans === null) throw new Error('Deezer reply has no fan count' + (body?.error?.message ? `: ${String(body.error.message).slice(0, 80)}` : ''));
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO platform_stats (platform, metric, day, value) VALUES ('deezer', 'followers', ?1, ?2)
        ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`).bind(today, fans),
      env.DB.prepare(UPSERT_META).bind('deezer_day', today),
      env.DB.prepare(`DELETE FROM meta WHERE key = 'deezer_last_error'`),
    ]);
    return { ok: true, followers: fans };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).slice(0, 200);
    console.error('deezer fetch failed: ' + msg);
    try { await env.DB.prepare(UPSERT_META).bind('deezer_last_error', `${msg} (${new Date(now).toISOString()})`).run(); } catch { /* best effort */ }
    return { ok: false, error: msg };
  }
}

/** Called from the hourly cron. Runs once per UTC day from 05:00; after a failure it tries again, at most 4 times a day. Never throws. */
export async function runDailyDeezer(env: Env, now = Date.now()): Promise<void> {
  try {
    if (!env.DEEZER_SHOW_ID) return;
    if (new Date(now).getUTCHours() < START_HOUR) return;
    const day = utcDay(now);
    const get = async (key: string) => (await env.DB.prepare(`SELECT value FROM meta WHERE key = ?1`).bind(key).first<{ value: string }>())?.value ?? '';
    if ((await get('deezer_day')) === day) return;
    const [ad, an] = (await get('deezer_attempts')).split(':');
    const tries = ad === day ? Number(an) || 0 : 0;
    if (tries >= MAX_ATTEMPTS_PER_DAY) return;
    await env.DB.prepare(UPSERT_META).bind('deezer_attempts', `${day}:${tries + 1}`).run();
    await fetchDeezer(env, now);
  } catch (e) {
    console.error('deezer schedule failed', e);
  }
}
