import { authorize } from './auth';
import { handleFeed } from './feed';
import { handleMedia } from './media';
import { handlePlatform, originOk } from './platform';
import { refreshIfStale, rollup } from './rollup';
import { buildStats } from './stats';
import { handleSpotifyRefresh, runDailySpotify } from './spotify';
import { handleReportSend, runWeeklyReport } from './report';
import type { Env } from './env';

const list = (s: string | undefined) => (s ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

function hostOf(req: Request, env: Env): string {
  const dev = env.DEV === '1' ? req.headers.get('x-dev-host') : null;
  return (dev ?? new URL(req.url).hostname).toLowerCase();
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    let host: string;
    try {
      host = hostOf(req, env);
      if (host === env.STATS_HOST.toLowerCase()) return await handleStats(req, env);
      if (list(env.FEED_HOSTS).includes(host)) return await handleFeed(req, env, ctx);
      if (list(env.MEDIA_HOSTS).includes(host)) return await handleMedia(req, env, ctx);
    } catch (e) {
      console.error('worker error, passing through', e);
      return fetch(req);
    }
    if (host.endsWith('.workers.dev') || host === 'localhost' || host.startsWith('127.')) {
      return new Response('Not Found', { status: 404 });
    }
    return fetch(req); // unknown host on a route: never break it
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Heavy tables (monthly, audience) every 6 hours; per-day tables every hour.
    const heavy = new Date(event.scheduledTime).getUTCHours() % 6 === 0;
    ctx.waitUntil(rollup(env, { now: event.scheduledTime, heavy }));
    // Own waitUntil: a Spotify failure must never touch the rollup. runDailySpotify never throws.
    ctx.waitUntil(runDailySpotify(env, event.scheduledTime).catch((e) => console.error('spotify job failed', e)));
    // Weekly email. Own waitUntil for the same reason. runWeeklyReport never throws.
    ctx.waitUntil(runWeeklyReport(env, event.scheduledTime).catch((e) => console.error('weekly report failed', e)));
  },
} satisfies ExportedHandler<Env>;

async function handleStats(req: Request, env: Env): Promise<Response> {
  let res: Response;
  try { res = await statsInner(req, env); } catch (e) {
    console.error('stats error', e);
    res = new Response('Internal error', { status: 500 });
  }
  const out = new Response(res.body, res);
  out.headers.set('x-robots-tag', 'noindex');
  out.headers.set('referrer-policy', 'no-referrer');
  out.headers.set('x-content-type-options', 'nosniff');
  return out;
}

async function statsInner(req: Request, env: Env): Promise<Response> {
  const denied = await authorize(req, env);
  if (denied) return denied;
  const url = new URL(req.url);
  if (url.pathname === '/api/stats' && req.method === 'GET') {
    const n = Math.floor(Number(url.searchParams.get('days') ?? 90));
    const days = Math.min(730, Math.max(1, Number.isFinite(n) ? n : 90));
    await refreshIfStale(env);
    return Response.json(await buildStats(env, days), { headers: { 'cache-control': 'private, max-age=60' } });
  }
  if (url.pathname === '/api/platform') return handlePlatform(req, env);
  if (url.pathname === '/api/spotify/refresh') {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
    if (!originOk(req, env)) return Response.json({ ok: false, error: 'bad origin' }, { status: 403, headers: { 'cache-control': 'no-store' } });
    return handleSpotifyRefresh(env);
  }
  if (url.pathname === '/api/report/send') {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
    if (!originOk(req, env)) return Response.json({ ok: false, error: 'bad origin' }, { status: 403, headers: { 'cache-control': 'no-store' } });
    return handleReportSend(env);
  }
  if (url.pathname === '/api/rollup') {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
    await rollup(env, { heavy: true });
    return Response.json({ ok: true });
  }
  return env.ASSETS.fetch(req);
}
