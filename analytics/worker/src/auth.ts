// Stats-host auth. Fail closed: Cloudflare Access JWT, else Basic with DASH_TOKEN, else 503.
import type { Env } from './env';

export interface Jwk { kid?: string; kty: string; n: string; e: string; alg?: string }

const b64uToBytes = (s: string): Uint8Array<ArrayBuffer> => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const b64uJson = (s: string) => JSON.parse(new TextDecoder().decode(b64uToBytes(s)));

/** Verify an RS256 Access JWT against known keys. Checks signature, aud, iss, exp, nbf. */
export async function verifyJwt(
  token: string, keys: Jwk[], opts: { aud: string; iss: string; now?: number },
): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const header = b64uJson(parts[0]);
    if (header.alg !== 'RS256') return false;
    const jwk = keys.find((k) => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) return false;
    const key = await crypto.subtle.importKey(
      'jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64uToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!ok) return false;
    const p = b64uJson(parts[1]);
    const now = Math.floor((opts.now ?? Date.now()) / 1000);
    const auds: unknown[] = Array.isArray(p.aud) ? p.aud : [p.aud];
    return auds.includes(opts.aud) && p.iss === opts.iss && typeof p.exp === 'number' && p.exp > now
      && (p.nbf === undefined || p.nbf <= now);
  } catch {
    return false;
  }
}

// Keys cached in memory per isolate; refetched hourly, or once a minute when a kid is unknown.
let certCache: { team: string; keys: Jwk[]; at: number } | null = null;

async function getKeys(team: string, force: boolean): Promise<Jwk[]> {
  const age = certCache && certCache.team === team ? Date.now() - certCache.at : Infinity;
  if (certCache && certCache.team === team && age < (force ? 60_000 : 3_600_000)) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const keys = ((await res.json()) as { keys: Jwk[] }).keys;
  certCache = { team, keys, at: Date.now() };
  return keys;
}

async function checkAccess(req: Request, env: Env): Promise<boolean> {
  const token = req.headers.get('cf-access-jwt-assertion');
  if (!token) return false;
  const team = env.ACCESS_TEAM_DOMAIN!.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const opts = { aud: env.ACCESS_AUD!, iss: `https://${team}` };
  try {
    if (await verifyJwt(token, await getKeys(team, false), opts)) return true;
    return await verifyJwt(token, await getKeys(team, true), opts);
  } catch (e) {
    console.error('access verify failed', e);
    return false;
  }
}

/** Constant-time string compare (via SHA-256 digests of equal length). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da), y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function checkBasic(req: Request, token: string): Promise<boolean> {
  const m = /^Basic\s+(.+)$/i.exec(req.headers.get('authorization') ?? '');
  if (!m) return false;
  let decoded: string;
  try { decoded = new TextDecoder().decode(b64uToBytes(m[1].trim())); } catch { return false; }
  const i = decoded.indexOf(':');
  return safeEqual(i < 0 ? '' : decoded.slice(i + 1), token);
}

/** Returns null when authorized, else the error response. */
export async function authorize(req: Request, env: Env): Promise<Response | null> {
  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    return (await checkAccess(req, env)) ? null : new Response('Forbidden', { status: 403 });
  }
  if (env.DASH_TOKEN) {
    if (await checkBasic(req, env.DASH_TOKEN)) return null;
    return new Response('Unauthorized', {
      status: 401, headers: { 'www-authenticate': 'Basic realm="stats", charset="UTF-8"' },
    });
  }
  return new Response('auth not configured', { status: 503 });
}
