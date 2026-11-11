#!/usr/bin/env node
// Probe for the unofficial Spotify for Creators analytics API. Plain Node 22, no dependencies.
// Run: SPOTIFY_SP_DC=... SPOTIFY_SP_KEY=... SPOTIFY_SHOW_ID=... node scripts/spotify-probe.mjs
// It runs the same login flow as src/spotify.ts, then calls each endpoint once.
// It never prints cookies, the token or headers.
import { createHash, randomBytes } from 'node:crypto';

const DC = process.env.SPOTIFY_SP_DC, KEY = process.env.SPOTIFY_SP_KEY, SHOW = process.env.SPOTIFY_SHOW_ID;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '05a1371ee5194c27860b3ff3ff3979d2';
const BASE = 'https://generic.wg.spotify.com/podcasters/v0';
const AUTH = 'https://accounts.spotify.com/oauth2/v2/auth';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const REDIRECT = 'https://podcasters.spotify.com';
const SCOPE = 'streaming ugc-image-upload user-read-email user-read-private';

const secrets = [DC, KEY].filter(Boolean);
let token = '';
const redact = (t) => {
  let s = String(t);
  for (const x of secrets.concat(token ? [token] : [])) s = s.split(x).join('[redacted]');
  return s
    .replace(/\b(sp_dc|sp_key|code|access_token|refresh_token|state|code_verifier)(["']?\s*[=:]\s*["']?)[^"'&\s,}]+/gi, '$1$2[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/g, 'Bearer [redacted]');
};
const fail = (step, msg) => { console.error(`FAIL at step "${step}": ${redact(msg)}`); process.exit(1); };
const log = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));

if (!DC || !KEY || !SHOW) {
  const missing = ['SPOTIFY_SP_DC', 'SPOTIFY_SP_KEY', 'SPOTIFY_SHOW_ID'].filter((k) => !process.env[k]);
  fail('config', 'missing environment variables: ' + missing.join(', '));
}

const rnd = (n) => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; const b = randomBytes(n); let o = ''; for (let i = 0; i < n; i++) o += c[b[i] % c.length]; return o; };
const day = (d) => d.toISOString().slice(0, 10);
const ago = (n) => day(new Date(Date.now() - n * 86400000));

async function req(step, url, init) {
  let res;
  try { res = await fetch(url, { redirect: 'manual', ...init }); } catch (e) { fail(step, 'network error: ' + (e && e.message)); }
  return res;
}
function describe(v) {
  if (Array.isArray(v)) return `array(${v.length})`;
  if (v && typeof v === 'object') return `object(${Object.keys(v).length} keys)`;
  return typeof v;
}
function shape(step, path, status, body) {
  log(`[${step}] ${path} -> HTTP ${status}`);
  if (body && typeof body === 'object') {
    log('  top-level keys:', Array.isArray(body) ? '(array)' : Object.keys(body));
    for (const [k, v] of Object.entries(Array.isArray(body) ? { '(root)': body } : body)) {
      if (Array.isArray(v)) {
        log(`  ${k}: array length ${v.length}`);
        if (v.length) { log('    first:', redact(JSON.stringify(v[0]).slice(0, 300))); log('    last:', redact(JSON.stringify(v[v.length - 1]).slice(0, 300))); }
      } else log(`  ${k}: ${describe(v)}`);
    }
  }
}
async function call(step, path, params) {
  const qs = params ? '?' + new URLSearchParams(params) : '';
  const res = await req(step, `${BASE}/${path}${qs}`, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } });
  const text = await res.text();
  const shown = path.replace(SHOW, '<show>');
  if (!res.ok) { log(`[${step}] ${shown} -> HTTP ${res.status}`); log('  body:', redact(text.slice(0, 300))); fail(step, `HTTP ${res.status}`); }
  let j; try { j = JSON.parse(text); } catch { fail(step, `${shown}: response is not JSON`); }
  shape(step, shown, res.status, j);
  return j;
}

async function main() {
  // Step 1: authorization page (cookies in, code out)
  const state = rnd(32), verifier = rnd(64);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const authUrl = AUTH + '?' + new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, scope: SCOPE, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: 'S256', state, response_mode: 'web_message', prompt: 'none' });
  let res = await req('auth-page', authUrl, { headers: { cookie: `sp_dc=${DC}; sp_key=${KEY}`, accept: 'text/html' } });
  log(`[auth-page] accounts.spotify.com/oauth2/v2/auth -> HTTP ${res.status}`);
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location') || '';
    log('  redirect to path:', redact(loc.split('?')[0].replace(/^https?:\/\/[^/]+/, '')));
    fail('auth-page', 'redirect, cookies are probably expired. Renew the cookies');
  }
  if (res.status === 401 || res.status === 403) fail('auth-page', `HTTP ${res.status}: Spotify session expired: renew the cookies`);
  const html = await res.text();
  if (!res.ok) { log('  body:', redact(html.slice(0, 300))); fail('auth-page', `HTTP ${res.status}`); }
  if (html.includes('login_required')) fail('auth-page', 'login_required: Spotify session expired: renew the cookies');
  const m = /const authorizationResponse = ([\s\S]*?);/.exec(html);
  if (!m) fail('auth-page', 'page has no authorizationResponse (login flow may have changed)');
  const pick = (k) => new RegExp(`["']?${k}["']?\\s*:\\s*["']?([^"',}\\s]+)`).exec(m[1])?.[1];
  const code = pick('code'), st = pick('state'), err = pick('error');
  if (err) fail('auth-page', 'auth refused: ' + err.slice(0, 60));
  if (!code) fail('auth-page', 'no code in authorizationResponse');
  if (st !== state) fail('auth-page', 'state mismatch');
  log('  got an authorization code (value not shown)');

  // Step 2: token
  secrets.push(code);
  res = await req('token', TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: REDIRECT, code_verifier: verifier }) });
  log(`[token] accounts.spotify.com/api/token -> HTTP ${res.status}`);
  const tt = await res.text();
  if (!res.ok) { log('  body:', redact(tt.slice(0, 300))); fail('token', `HTTP ${res.status}`); }
  let tj; try { tj = JSON.parse(tt); } catch { fail('token', 'response is not JSON'); }
  if (!tj.access_token) fail('token', 'no access_token in response');
  token = tj.access_token;
  log('  top-level keys:', Object.keys(tj), ' expires_in:', tj.expires_in);

  // Step 3: endpoints, each once
  const start = ago(30), end = ago(1);
  const rng = { start, end };
  const meta = await call('show-metadata', `shows/${SHOW}/metadata`);
  // Plain numbers and flags only (no secrets): useful to compare with our own download counts.
  for (const k of ['totalEpisodes', 'starts', 'streams', 'listeners', 'followers', 'hasPassthroughEnabled', 'feedUrl', 'consumptionOrder']) log(`  ${k} = ${JSON.stringify(meta[k])}`);
  await call('followers', `shows/${SHOW}/followers`, rng);
  await call('listeners', `shows/${SHOW}/listeners`, rng);
  await call('detailed-streams', `shows/${SHOW}/detailedStreams`, rng);
  const list = await call('episodes-page-1', `shows/${SHOW}/episodes`, { ...rng, page: 1, size: 50, sortBy: 'releaseDate', sortOrder: 'descending', filter: '' });
  const first = Array.isArray(list.episodes) ? list.episodes[0] : null;
  if (first && first.id) {
    log('  list totals on first episode: starts', first.starts, 'streams', first.streams, 'listeners', first.listeners);
    await call('episode-metadata', `episodes/${first.id}/metadata`);
  } else log('[episode-metadata] skipped: the list has no episodes');
  // Long range, to learn the maximum window (used by the backfill).
  await call('long-range-365d', `shows/${SHOW}/followers`, { start: ago(366), end: ago(1) });
  log('OK: all steps passed');
}
main().catch((e) => fail('unexpected', e && e.message ? e.message : String(e)));
