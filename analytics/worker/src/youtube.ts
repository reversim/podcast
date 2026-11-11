// Daily YouTube numbers (Data API v3, API key only). Never throws: every failure becomes {ok:false,error}.
// Budget for a 1000-video channel: 1 + 20 + 20 = 41 fetch subrequests (+ about 5 D1 calls) per run, under the free-plan limit of 50.
// D1 writes use json_each, so one statement carries up to 100 videos and the whole run needs few batch calls.
import { utcDay } from './lib';
import type { Env } from './env';

const API = 'https://www.googleapis.com/youtube/v3/';
export const MAX_VIDEOS = 1000;
export const NOT_CONFIGURED = 'YouTube is not configured: set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID';
const BATCH = 50; // statements per db.batch call
const PER_STMT = 100; // videos per json_each statement (keeps the bound text well under the D1 size limit)

export interface YtOk { ok: true; channel: { followers: number | null; views: number; videos: number }; videos_seen: number; rows_written: number }
export interface YtFail { ok: false; error: string }
export type YtResult = YtOk | YtFail;

export const youtubeConfigured = (env: Env) => Boolean(env.YOUTUBE_API_KEY && env.YOUTUBE_CHANNEL_ID);

/** Removes the API key from any text: the exact key, and any `key=...` query value. */
export function redact(text: string, key?: string): string {
  let out = text.replace(/(key=)[^&\s"'<>]*/gi, '$1REDACTED');
  if (key) out = out.split(key).join('REDACTED');
  return out;
}

class YtError extends Error {}

async function api(path: string, params: Record<string, string>, key: string): Promise<any> {
  const url = API + path + '?' + new URLSearchParams({ ...params, key }).toString();
  let res: Response;
  try { res = await fetch(url); } catch (e) {
    throw new YtError('network error: ' + redact(String((e as Error)?.message ?? e), key));
  }
  let body: any = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    const err = body?.error;
    const reason = err?.errors?.[0]?.reason ?? err?.status;
    throw new YtError(redact(`YouTube API ${res.status}${reason ? ' ' + reason : ''}: ${err?.message ?? res.statusText ?? 'error'}`, key));
  }
  return body;
}

const int = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

interface Vid { id: string; title: string; published: string; views: number; likes: number | null; comments: number | null }

const UPSERT_PLATFORM = `INSERT INTO platform_stats (platform, metric, day, value) VALUES ('youtube', ?1, ?2, ?3)
  ON CONFLICT (platform, metric, day) DO UPDATE SET value = excluded.value`;
const UPSERT_META = `INSERT INTO meta (key, value) VALUES ('youtube_day', ?1) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
const UPSERT_VIDEOS = `INSERT INTO yt_videos (video_id, title, published)
  SELECT json_extract(value, '$.i'), json_extract(value, '$.t'), json_extract(value, '$.p') FROM json_each(?1) WHERE true
  ON CONFLICT (video_id) DO UPDATE SET title = excluded.title, published = excluded.published`;
const UPSERT_DAILY = `INSERT INTO yt_video_daily (day, video_id, views, likes, comments)
  SELECT ?1, json_extract(value, '$.i'), json_extract(value, '$.v'), json_extract(value, '$.l'), json_extract(value, '$.c') FROM json_each(?2) WHERE true
  ON CONFLICT (video_id, day) DO UPDATE SET views = excluded.views, likes = excluded.likes, comments = excluded.comments`;

/** Fetches the channel and its videos and stores them. Logs one line on failure, never the key. */
export async function fetchYoutube(env: Env, now = Date.now()): Promise<YtResult> {
  if (!youtubeConfigured(env)) return { ok: false, error: NOT_CONFIGURED };
  const key = env.YOUTUBE_API_KEY as string, channelId = env.YOUTUBE_CHANNEL_ID as string;
  const day = utcDay(now);
  try {
    const ch = await api('channels', { part: 'statistics,contentDetails,snippet', id: channelId }, key);
    const item = ch?.items?.[0];
    if (!item) throw new YtError('channel not found: check YOUTUBE_CHANNEL_ID');
    const st = item.statistics ?? {};
    const followers = st.hiddenSubscriberCount === true ? null : int(st.subscriberCount);
    const channel = { followers, views: int(st.viewCount) ?? 0, videos: int(st.videoCount) ?? 0 };
    const uploads: string | undefined = item.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) throw new YtError('channel has no uploads playlist');

    // Newest first. Stop after 1000 ids (20 pages).
    let ids: string[] = [], token: string | undefined, more = false;
    do {
      const p = await api('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: '50', ...(token ? { pageToken: token } : {}) }, key);
      for (const it of p?.items ?? []) { const v = it?.contentDetails?.videoId; if (typeof v === 'string') ids.push(v); }
      token = p?.nextPageToken || undefined;
      more = Boolean(token);
    } while (token && ids.length < MAX_VIDEOS);
    if (ids.length > MAX_VIDEOS) ids = ids.slice(0, MAX_VIDEOS);
    if (more && ids.length >= MAX_VIDEOS) console.warn(`youtube: more than ${MAX_VIDEOS} videos, using the newest ${MAX_VIDEOS}`);

    const vids: Vid[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const r = await api('videos', { part: 'statistics,snippet', id: ids.slice(i, i + 50).join(',') }, key);
      for (const v of r?.items ?? []) {
        const views = int(v?.statistics?.viewCount);
        if (typeof v?.id !== 'string' || views == null) continue;
        vids.push({ id: v.id, title: String(v.snippet?.title ?? '').slice(0, 300), published: String(v.snippet?.publishedAt ?? '').slice(0, 10),
          views, likes: int(v.statistics?.likeCount), comments: int(v.statistics?.commentCount) });
      }
    }

    const db = env.DB;
    // Channel numbers first, so a DB without the video tables still gets them.
    const rows: [string, number][] = [['views', channel.views], ['videos', channel.videos]];
    if (followers != null) rows.unshift(['followers', followers]);
    await db.batch(rows.map(([m, v]) => db.prepare(UPSERT_PLATFORM).bind(m, day, v)));
    let written = rows.length;

    // Latest stored state per video: two primary-key seeks per video, no table scan.
    const have = (await db.prepare(
      `SELECT v.video_id AS id, v.title AS title, v.published AS published,
         (SELECT views FROM yt_video_daily d WHERE d.video_id = v.video_id ORDER BY day DESC LIMIT 1) AS views
       FROM yt_videos v`).all<{ id: string; title: string; published: string; views: number | null }>()).results;
    const old = new Map(have.map((r) => [r.id, r]));
    const metaChanged: Vid[] = [], viewsChanged: Vid[] = [];
    for (const v of vids) {
      const o = old.get(v.id);
      if (!o || o.title !== v.title || o.published !== v.published) metaChanged.push(v);
      if (!o || o.views == null || o.views !== v.views) viewsChanged.push(v);
    }
    const stmts: D1PreparedStatement[] = [];
    for (let i = 0; i < metaChanged.length; i += PER_STMT) {
      stmts.push(db.prepare(UPSERT_VIDEOS).bind(JSON.stringify(metaChanged.slice(i, i + PER_STMT).map((v) => ({ i: v.id, t: v.title, p: v.published })))));
    }
    for (let i = 0; i < viewsChanged.length; i += PER_STMT) {
      stmts.push(db.prepare(UPSERT_DAILY).bind(day, JSON.stringify(viewsChanged.slice(i, i + PER_STMT).map((v) => ({ i: v.id, v: v.views, l: v.likes, c: v.comments })))));
    }
    stmts.push(db.prepare(UPSERT_META).bind(day));
    for (let i = 0; i < stmts.length; i += BATCH) await db.batch(stmts.slice(i, i + BATCH));
    written += metaChanged.length + viewsChanged.length;
    return { ok: true, channel, videos_seen: vids.length, rows_written: written };
  } catch (e) {
    const msg = redact(e instanceof Error ? e.message : String(e), key);
    console.error('youtube fetch failed: ' + msg);
    return { ok: false, error: msg };
  }
}

/** Called from the hourly cron. Runs the fetch once per UTC day, from 03:00 on; retries hourly after a failure. */
export async function runDailyYoutube(env: Env, now = Date.now()): Promise<void> {
  try {
    if (!youtubeConfigured(env)) return;
    if (new Date(now).getUTCHours() < 3) return;
    const m = await env.DB.prepare(`SELECT value FROM meta WHERE key = 'youtube_day'`).first<{ value: string }>();
    if (m?.value === utcDay(now)) return;
    await fetchYoutube(env, now);
  } catch (e) {
    console.error('youtube schedule failed: ' + redact(String((e as Error)?.message ?? e), env.YOUTUBE_API_KEY));
  }
}

/** POST /api/youtube/refresh. Call only after authorize() and the origin check. */
export async function handleYoutubeRefresh(env: Env, now = Date.now()): Promise<Response> {
  const r = await fetchYoutube(env, now);
  const status = r.ok ? 200 : r.error === NOT_CONFIGURED ? 400 : 502;
  return Response.json(r, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * The `youtube` block of GET /api/stats. Never throws.
 * Query choice: yt_videos has one row per video (at most ~1000). Per video, three correlated subqueries
 * each seek the (video_id, day) primary key and read one row: latest, last at or before the range start,
 * first after it. That is about 4 rows read per video, instead of scanning all of yt_video_daily.
 */
export async function youtubeStats(env: Env, from: string) {
  const out = { channel_id: env.YOUTUBE_CHANNEL_ID ?? '', configured: youtubeConfigured(env), last_day: '', videos: [] as unknown[] };
  try {
    const [vs, last] = await Promise.all([
      env.DB.prepare(
        `SELECT v.video_id AS id, v.title AS title, v.published AS published,
           (SELECT views FROM yt_video_daily d WHERE d.video_id = v.video_id ORDER BY day DESC LIMIT 1) AS views,
           (SELECT views FROM yt_video_daily d WHERE d.video_id = v.video_id AND day <= ?1 ORDER BY day DESC LIMIT 1) AS base,
           (SELECT views FROM yt_video_daily d WHERE d.video_id = v.video_id AND day > ?1 ORDER BY day ASC LIMIT 1) AS first_in
         FROM yt_videos v`).bind(from).all<{ id: string; title: string; published: string; views: number | null; base: number | null; first_in: number | null }>(),
      env.DB.prepare(`SELECT value FROM meta WHERE key = 'youtube_day'`).all<{ value: string }>(),
    ]);
    out.last_day = last.results[0]?.value ?? '';
    out.videos = vs.results.filter((r) => r.views != null).map((r) => {
      const views = r.views as number;
      return { id: r.id, title: r.title, published: r.published, views, views_in_range: Math.max(0, views - (r.base ?? r.first_in ?? views)) };
    }).sort((a, b) => (b.views_in_range - a.views_in_range) || (b.views - a.views) || (a.id < b.id ? -1 : 1)).slice(0, 200);
  } catch (e) {
    console.error('youtube stats failed: ' + String((e as Error)?.message ?? e));
    out.videos = [];
  }
  return out;
}
