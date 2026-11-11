// Cookieless page-view beacon: POST /_e on the media hosts. Never throws, never blocks audio.
import { listenerId, utcDay } from './lib';
import { classify } from './ua';
import type { Env } from './env';

export const BEACON_PATH = '/_e';
const MAX_BODY = 1024;
const PATH_RE = /^\/[A-Za-z0-9\-._~/%]{0,200}$/;
const REF_RE = /^[a-z0-9.\-]{0,100}$/;

export type Beacon = { t: 'pv' | 'play'; p: string; r: string };

const list = (s: string | undefined) => (s ?? '').split(',').map((h) => h.trim().toLowerCase().replace(/\/$/, '')).filter(Boolean);
const siteOrigins = (env: Env) => list(env.SITE_ORIGINS ?? 'https://www.reversim.com');

function cors(env: Env, origin: string | null): Headers {
  return new Headers({
    'access-control-allow-origin': origin ?? siteOrigins(env)[0] ?? 'https://www.reversim.com',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'cache-control': 'no-store',
    vary: 'Origin',
  });
}

/** The caller's origin (Origin header, else Referer origin) when it is allowed, else null. */
export function allowedOrigin(req: Request, env: Env): string | null {
  let o = req.headers.get('origin');
  if (!o) {
    try { o = new URL(req.headers.get('referer') ?? '').origin; } catch { return null; }
  }
  o = o.toLowerCase();
  if (siteOrigins(env).includes(o)) return o;
  if (env.DEV === '1' && /^http:\/\/localhost(:\d+)?$/.test(o)) return o;
  return null;
}

/** Read at most MAX_BODY bytes. null when the body is larger. */
async function readSmall(req: Request): Promise<string | null> {
  const cl = Number(req.headers.get('content-length'));
  if (Number.isFinite(cl) && cl > MAX_BODY) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.byteLength;
    if (n > MAX_BODY) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(n);
  let off = 0;
  for (const c of chunks) { all.set(c, off); off += c.byteLength; }
  return new TextDecoder().decode(all);
}

/** Validate and normalize a beacon body. null = drop silently. */
export function parseBeacon(text: string, siteHosts: string[]): Beacon | null {
  let j: unknown;
  try { j = JSON.parse(text); } catch { return null; }
  if (!j || typeof j !== 'object') return null;
  const { t, p, r } = j as Record<string, unknown>;
  if (t !== 'pv' && t !== 'play') return null;
  if (typeof p !== 'string' || !PATH_RE.test(p)) return null;
  const rr = r === undefined || r === null ? '' : r;
  if (typeof rr !== 'string' || !REF_RE.test(rr)) return null;
  let ref: string = rr;
  if (ref && siteHosts.includes(ref.replace(/^www\./, ''))) ref = '';
  let path = p.endsWith('/index.html') ? p.slice(0, -'index.html'.length) : p;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return { t, p: path || '/', r: ref };
}

export async function handleBeacon(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const origin = allowedOrigin(req, env);
    const headers = cors(env, origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') {
      headers.set('allow', 'POST, OPTIONS');
      return new Response('Method Not Allowed', { status: 405, headers });
    }
    if (origin) {
      const body = await readSmall(req);
      const hosts = siteOrigins(env).map((o) => { try { return new URL(o).hostname.replace(/^www\./, ''); } catch { return ''; } });
      const b = body === null ? null : parseBeacon(body, hosts);
      if (b) {
        const ua = req.headers.get('user-agent');
        const ip = req.headers.get('cf-connecting-ip');
        const country = (req as Request & { cf?: { country?: string } }).cf?.country ?? 'XX';
        ctx.waitUntil(record(env, b, ua, ip, country));
      }
    }
    return new Response(null, { status: 204, headers });
  } catch (e) {
    console.error('beacon failed', e);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }
}

async function record(env: Env, b: Beacon, ua: string | null, ip: string | null, country: string): Promise<void> {
  try {
    if (!env.HASH_SALT) { console.warn('HASH_SALT not set, not logging'); return; }
    const info = classify(ua);
    if (info.type === 'bot') return;
    const visitor = await listenerId(env.HASH_SALT, ip, ua);
    await env.DB.prepare(
      `INSERT INTO page_hits (day, path, visitor, ref, country, device, views, plays)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT (day, path, visitor) DO UPDATE SET views = views + excluded.views, plays = plays + excluded.plays`,
    ).bind(utcDay(), b.p, visitor, b.r, country, info.device, b.t === 'pv' ? 1 : 0, b.t === 'play' ? 1 : 0).run();
  } catch (e) {
    console.error('beacon logging failed', e);
  }
}
