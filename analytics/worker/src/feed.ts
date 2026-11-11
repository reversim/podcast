import { listenerId, notModified, parseSubscribers, utcDay } from './lib';
import { classify } from './ua';
import type { Env } from './env';

const TTL = 600;

export async function handleFeed(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (req.method === 'GET') ctx.waitUntil(logFeed(req, env));
  // Default mode: count the fetch, then send the client to the real feed with a temporary
  // redirect (302, so clients keep polling this host). FEED_MODE="proxy" returns the feed
  // body instead; it fails with "Too many redirects" while the zone SSL mode is Flexible,
  // because the Worker then reaches GitHub Pages over plain HTTP.
  if (env.FEED_MODE !== 'proxy') return Response.redirect(env.FEED_ORIGIN, 302);
  try {
    return await serveFeed(req, env);
  } catch (e) {
    console.error('feed proxy failed, redirecting', e);
    return Response.redirect(env.FEED_ORIGIN, 302);
  }
}

async function serveFeed(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return Response.redirect(env.FEED_ORIGIN, 302);
  const cache = caches.default;
  const key = new Request(env.FEED_ORIGIN);
  let cached = await cache.match(key);
  if (!cached) {
    const origin = await fetch(env.FEED_ORIGIN, { headers: { 'user-agent': 'reversim-feed-proxy' } });
    if (!origin.ok) throw new Error(`origin status ${origin.status}`);
    const h = new Headers();
    for (const n of ['content-type', 'etag', 'last-modified']) {
      const v = origin.headers.get(n);
      if (v) h.set(n, v);
    }
    h.set('cache-control', `public, max-age=${TTL}`);
    cached = new Response(await origin.arrayBuffer(), { status: 200, headers: h });
    try { await cache.put(key, cached.clone()); } catch (e) { console.warn('cache put failed', e); }
  }
  const h = new Headers(cached.headers);
  if (!h.has('content-type')) h.set('content-type', 'application/rss+xml; charset=utf-8');
  h.set('cache-control', `public, max-age=${TTL}`);
  if (notModified(req.headers, h.get('etag'), h.get('last-modified'))) {
    h.delete('content-type');
    return new Response(null, { status: 304, headers: h });
  }
  return new Response(req.method === 'HEAD' ? null : cached.body, { status: 200, headers: h });
}

async function logFeed(req: Request, env: Env): Promise<void> {
  try {
    if (!env.HASH_SALT) return;
    const ua = req.headers.get('user-agent');
    // The subscriber count changes between fetches; keep it out of the id so one fetcher is one row.
    const stable = ua?.replace(/\d+(\s+subscribers?)/i, 'N$1') ?? null;
    const listener = await listenerId(env.HASH_SALT, req.headers.get('cf-connecting-ip'), stable);
    const info = classify(ua);
    await env.DB.prepare(
      `INSERT INTO feed_hits (day, listener, app, ua_type, subs, reqs) VALUES (?1, ?2, ?3, ?4, ?5, 1)
       ON CONFLICT (day, listener) DO UPDATE SET reqs = reqs + 1,
         subs = CASE WHEN excluded.subs IS NULL THEN subs WHEN subs IS NULL THEN excluded.subs
                     ELSE max(subs, excluded.subs) END`,
    ).bind(utcDay(), listener, info.name, info.type, parseSubscribers(ua)).run();
  } catch (e) {
    console.error('feed logging failed', e);
  }
}
