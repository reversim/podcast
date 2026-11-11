// Serve an R2 object with Range / conditional / HEAD support (ORIGIN_MODE=r2).
import { notModified, parseRange } from './lib';
import type { Env } from './env';

export async function serveR2(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  let key = url.pathname.slice(1);
  try { key = decodeURIComponent(key); } catch { /* keep raw */ }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const head = key ? await env.BUCKET.head(key) : null;
  if (!head) return new Response('Not Found', { status: 404 });

  const h = new Headers();
  head.writeHttpMetadata(h);
  if (!h.has('content-type')) h.set('content-type', 'audio/mpeg');
  if (!h.has('cache-control')) h.set('cache-control', 'public, max-age=86400');
  const lastModified = head.uploaded.toUTCString();
  h.set('etag', head.httpEtag);
  h.set('last-modified', lastModified);
  h.set('accept-ranges', 'bytes');

  if (notModified(req.headers, head.httpEtag, lastModified)) {
    h.delete('content-type');
    return new Response(null, { status: 304, headers: h });
  }

  // If-Range: only honour Range when the validator still matches.
  let rangeHeader = req.headers.get('range');
  const ifRange = req.headers.get('if-range');
  if (rangeHeader && ifRange && ifRange.trim() !== head.httpEtag && ifRange.trim() !== lastModified) rangeHeader = null;

  const range = parseRange(rangeHeader, head.size);
  if (range === 'unsatisfiable') {
    h.set('content-range', `bytes */${head.size}`);
    return new Response(null, { status: 416, headers: h });
  }
  const partial = range !== null;
  const start = range ? range.start : 0;
  const length = range ? range.end - range.start + 1 : head.size;
  h.set('content-length', String(length));
  if (range) h.set('content-range', `bytes ${range.start}-${range.end}/${head.size}`);
  if (req.method === 'HEAD') return new Response(null, { status: partial ? 206 : 200, headers: h });

  const obj = await env.BUCKET.get(key, partial ? { range: { offset: start, length } } : undefined);
  if (!obj) return new Response('Not Found', { status: 404 });
  return new Response((obj as R2ObjectBody).body, { status: partial ? 206 : 200, headers: h });
}
