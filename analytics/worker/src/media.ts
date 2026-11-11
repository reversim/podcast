import { listenerId, parseContentRange, utcDay } from './lib';
import { classify } from './ua';
import { serveR2 } from './r2';
import type { Env } from './env';

export async function handleMedia(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let res: Response;
  try {
    res = env.ORIGIN_MODE === 'r2' ? await serveR2(req, env) : await fetch(req);
  } catch (e) {
    console.error('media handler failed, falling back to origin', e);
    return fetch(req); // never break audio
  }
  if (req.method === 'GET') ctx.waitUntil(logHit(req, res, env));
  return res;
}

/** Decide if a response counts as a logged request. Returns null when it should be skipped. */
export function measure(req: Request, res: Response): { file: string; bytes: number; size: number } | null {
  if (req.method !== 'GET' || (res.status !== 200 && res.status !== 206)) return null;
  const path = new URL(req.url).pathname;
  if (!path.toLowerCase().endsWith('.mp3')) return null;
  let file = path.slice(path.lastIndexOf('/') + 1);
  try { file = decodeURIComponent(file); } catch { /* keep raw */ }
  const cl = res.headers.get('content-length');
  let bytes = cl === null ? NaN : Number(cl);
  let size = bytes;
  if (res.status === 206) {
    const cr = parseContentRange(res.headers.get('content-range'));
    if (!cr) return null;
    bytes = cr.end - cr.start + 1;
    size = cr.total ?? bytes;
  }
  if (!Number.isFinite(bytes) || bytes <= 2) return null; // range probes like bytes=0-1
  return { file, bytes, size };
}

async function logHit(req: Request, res: Response, env: Env): Promise<void> {
  try {
    const m = measure(req, res);
    if (!m) return;
    if (!env.HASH_SALT) { console.warn('HASH_SALT not set, not logging'); return; }
    const ua = req.headers.get('user-agent');
    const listener = await listenerId(env.HASH_SALT, req.headers.get('cf-connecting-ip'), ua);
    const info = classify(ua);
    const country = (req as Request & { cf?: { country?: string } }).cf?.country ?? 'XX';
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO hits (day, file, listener, app, ua_type, device, country, size, bytes, reqs, first_ts)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10)
       ON CONFLICT (day, file, listener) DO UPDATE SET bytes = bytes + excluded.bytes, reqs = reqs + 1`,
    ).bind(utcDay(now), m.file, listener, info.name, info.type, info.device, country, m.size, m.bytes, Math.floor(now / 1000)).run();
  } catch (e) {
    console.error('hit logging failed', e);
  }
}
