// Daily YouTube numbers of the podcast playlist. Source: the official YouTube Data API v3 with an API key.
//   1. GET playlistItems (50 items per page): the video ids and the privacy status of each item.
//   2. GET videos?part=statistics (50 ids per call): the view count of each public video.
// Rows in platform_stats for today: ('youtube', 'views_total') is the sum of all-time views of the public videos,
// ('youtube', 'videos_public') and ('youtube', 'videos_private') are the item counts of the playlist.
// The key gives public data only: no watch time and no audience data (those need OAuth).
// Subrequests: about 2 * (items / 50). The job starts one hour after the other daily jobs, because one cron
// run has a limit on subrequests. The key goes in a header, not in the URL. Never throws.
import { utcDay } from './lib';
import type { Env } from './env';

const API = 'https://www.googleapis.com/youtube/v3';
const START_HOUR = 6;
const MAX_ATTEMPTS_PER_DAY = 4;
const MAX_PAGES = 20; // 1,000 playlist items
const UPSERT_META = `INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
const UPSERT_ROW = `INSERT INTO platform_stats (platform, metric, day, value) VALUES ('youtube', ?1, ?2, ?3)
  ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`;

export type YtResult =
  | { ok: true; views: number; videos_public: number; videos_private: number; subrequests: number }
  | { ok: false; error: string };

export const youtubeConfigured = (env: Env) => Boolean(env.YOUTUBE_PLAYLIST_ID && env.YOUTUBE_API_KEY);

const redact = (text: string, env: Env) => (env.YOUTUBE_API_KEY ? String(text).split(env.YOUTUBE_API_KEY).join('REDACTED') : String(text));

/** Sum of the view counts in a videos.list reply. The API gives each count as a string. */
export function viewsOf(body: any): number {
  let total = 0;
  for (const it of Array.isArray(body?.items) ? body.items : []) {
    const v = Number(it?.statistics?.viewCount);
    if (Number.isFinite(v) && v >= 0) total += v;
  }
  return total;
}

async function get(env: Env, path: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(`${API}/${path}?${new URLSearchParams(params)}`, {
    headers: { accept: 'application/json', 'x-goog-api-key': env.YOUTUBE_API_KEY as string },
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(`YouTube ${path} failed with HTTP ${res.status}` + (body?.error?.message ? `: ${String(body.error.message).slice(0, 100)}` : ''));
  if (!body || !Array.isArray(body.items)) throw new Error(`YouTube ${path} reply has no items`);
  return body;
}

/** Fetches the playlist numbers now and stores them. Never throws. */
export async function fetchYoutube(env: Env, now = Date.now()): Promise<YtResult> {
  if (!youtubeConfigured(env)) return { ok: false, error: 'YouTube is not configured: set YOUTUBE_PLAYLIST_ID and YOUTUBE_API_KEY' };
  const playlistId = (env.YOUTUBE_PLAYLIST_ID as string).trim();
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(playlistId)) return { ok: false, error: 'YOUTUBE_PLAYLIST_ID looks wrong: use the value of list= in the playlist address' };
  const today = utcDay(now);
  try {
    const publicIds: string[] = [];
    let hidden = 0, subrequests = 0, pageToken = '';
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = await get(env, 'playlistItems', { part: 'contentDetails,status', maxResults: '50', playlistId, ...(pageToken ? { pageToken } : {}) });
      subrequests++;
      for (const it of body.items) {
        const id = it?.contentDetails?.videoId;
        if (it?.status?.privacyStatus === 'public' && typeof id === 'string') publicIds.push(id);
        else hidden++;
      }
      pageToken = typeof body.nextPageToken === 'string' ? body.nextPageToken : '';
      if (!pageToken) break;
    }
    let views = 0;
    for (let i = 0; i < publicIds.length; i += 50) {
      views += viewsOf(await get(env, 'videos', { part: 'statistics', maxResults: '50', id: publicIds.slice(i, i + 50).join(',') }));
      subrequests++;
    }
    await env.DB.batch([
      env.DB.prepare(UPSERT_ROW).bind('views_total', today, views),
      env.DB.prepare(UPSERT_ROW).bind('videos_public', today, publicIds.length),
      env.DB.prepare(UPSERT_ROW).bind('videos_private', today, hidden),
      env.DB.prepare(UPSERT_META).bind('youtube_day', today),
      env.DB.prepare(UPSERT_META).bind('youtube_last_ok', new Date(now).toISOString()),
      env.DB.prepare(`DELETE FROM meta WHERE key = 'youtube_last_error'`),
    ]);
    return { ok: true, views, videos_public: publicIds.length, videos_private: hidden, subrequests };
  } catch (e) {
    const msg = redact(String((e as Error)?.message ?? e), env).slice(0, 200);
    console.error('youtube fetch failed: ' + msg);
    try { await env.DB.prepare(UPSERT_META).bind('youtube_last_error', `${msg} (${new Date(now).toISOString()})`).run(); } catch { /* best effort */ }
    return { ok: false, error: msg };
  }
}

/** Called from the hourly cron. Runs once per UTC day from 06:00; after a failure it tries again, at most 4 times a day. Never throws. */
export async function runDailyYoutube(env: Env, now = Date.now()): Promise<void> {
  try {
    if (!youtubeConfigured(env)) return;
    if (new Date(now).getUTCHours() < START_HOUR) return;
    const day = utcDay(now);
    const meta = async (key: string) => (await env.DB.prepare(`SELECT value FROM meta WHERE key = ?1`).bind(key).first<{ value: string }>())?.value ?? '';
    if ((await meta('youtube_day')) === day) return;
    const [ad, an] = (await meta('youtube_attempts')).split(':');
    const tries = ad === day ? Number(an) || 0 : 0;
    if (tries >= MAX_ATTEMPTS_PER_DAY) return;
    await env.DB.prepare(UPSERT_META).bind('youtube_attempts', `${day}:${tries + 1}`).run();
    await fetchYoutube(env, now);
  } catch (e) {
    console.error('youtube schedule failed: ' + redact(String((e as Error)?.message ?? e), env));
  }
}
