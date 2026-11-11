import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseBeacon } from '../src/beacon';
import { handleMedia } from '../src/media';
import type { Env } from '../src/env';

function setup(over: Partial<Env> = {}, dbFails = false) {
  const calls: unknown[][] = [];
  const sqls: string[] = [];
  const DB = {
    prepare: (sql: string) => ({
      bind: (...a: unknown[]) => ({
        run: async () => { if (dbFails) throw new Error('d1 down'); sqls.push(sql); calls.push(a); },
      }),
    }),
  };
  const env = { DB, HASH_SALT: 's', ORIGIN_MODE: 'passthrough', SITE_ORIGINS: 'https://www.reversim.com', ...over } as unknown as Env;
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p) } as unknown as ExecutionContext;
  return { env, ctx, calls, sqls, flush: () => Promise.all(pending) };
}
const HUMAN = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const post = (body: unknown, headers: Record<string, string> = {}, method = 'POST') =>
  new Request('https://m2.reversim.com/_e', {
    method,
    headers: { origin: 'https://www.reversim.com', 'user-agent': HUMAN, 'cf-connecting-ip': '1.2.3.4', ...headers },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
const pv = { t: 'pv', p: '/2026/11/x.html', r: 'google.com' };

afterEach(() => vi.unstubAllGlobals());

describe('beacon endpoint', () => {
  it('answers 204 with CORS and stores one row for a valid pv', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('must not reach origin'); });
    const { env, ctx, calls, sqls, flush } = setup();
    const res = await handleMedia(post(pv), env, ctx);
    await flush();
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://www.reversim.com');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(calls).toHaveLength(1);
    expect(sqls[0]).toContain('page_hits');
    expect(calls[0][1]).toBe('/2026/11/x.html');
    expect(calls[0][2]).toMatch(/^[0-9a-f]{32}$/);
    expect(calls[0][3]).toBe('google.com');
    expect(calls[0].slice(6)).toEqual([1, 0]);
  });
  it('counts a play as plays+1 and accepts the Referer origin as fallback', async () => {
    const { env, ctx, calls, flush } = setup();
    const res = await handleMedia(post({ t: 'play', p: '/' }, { origin: '', referer: 'https://www.reversim.com/a.html' }), env, ctx);
    await flush();
    expect(res.status).toBe(204);
    expect(calls[0].slice(6)).toEqual([0, 1]);
  });
  it('answers OPTIONS with 204 and other methods with 405', async () => {
    const { env, ctx, calls, flush } = setup();
    const o = await handleMedia(post('', {}, 'OPTIONS'), env, ctx);
    expect(o.status).toBe(204);
    expect(o.headers.get('access-control-allow-methods')).toContain('POST');
    expect((await handleMedia(post('', {}, 'GET'), env, ctx)).status).toBe(405);
    expect((await handleMedia(post('', {}, 'PUT'), env, ctx)).status).toBe(405);
    await flush();
    expect(calls).toHaveLength(0);
  });
  it('stores nothing for a bad, missing or null origin', async () => {
    const { env, ctx, calls, flush } = setup();
    for (const h of [{ origin: 'https://evil.example' }, { origin: 'null' }, { origin: '', referer: '' }, { origin: 'http://localhost:4321' }] as Record<string, string>[]) {
      const res = await handleMedia(post(pv, h), env, ctx);
      expect(res.status).toBe(204);
    }
    await flush();
    expect(calls).toHaveLength(0);
  });
  it('allows localhost only in DEV', async () => {
    const { env, ctx, calls, flush } = setup({ DEV: '1' });
    const res = await handleMedia(post(pv, { origin: 'http://localhost:4321' }), env, ctx);
    await flush();
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4321');
    expect(calls).toHaveLength(1);
  });
  it('drops oversized and invalid bodies silently', async () => {
    const { env, ctx, calls, flush } = setup();
    const big = JSON.stringify({ t: 'pv', p: '/', r: '', pad: 'x'.repeat(2000) });
    expect((await handleMedia(post(big), env, ctx)).status).toBe(204);
    // no content-length (chunked): the stream reader must still cap it
    const stream = new Request('https://m2.reversim.com/_e', {
      method: 'POST', headers: { origin: 'https://www.reversim.com', 'user-agent': HUMAN },
      body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close(); } }), duplex: 'half',
    } as RequestInit);
    expect((await handleMedia(stream, env, ctx)).status).toBe(204);
    expect((await handleMedia(post('not json'), env, ctx)).status).toBe(204);
    await flush();
    expect(calls).toHaveLength(0);
  });
  it('skips bots', async () => {
    const { env, ctx, calls, flush } = setup();
    await handleMedia(post(pv, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }), env, ctx);
    await flush();
    expect(calls).toHaveLength(0);
  });
  it('never throws when the database fails', async () => {
    const { env, ctx, flush } = setup({}, true);
    const res = await handleMedia(post(pv), env, ctx);
    await expect(flush()).resolves.toBeDefined();
    expect(res.status).toBe(204);
  });
  it('sends other media paths to the passthrough and leaves them unchanged', async () => {
    const { env, ctx, calls, flush } = setup();
    const fetchMock = vi.fn(async () => new Response('x', { status: 200, headers: { 'content-length': '5000000' } }));
    vi.stubGlobal('fetch', fetchMock);
    for (const path of ['/ep.mp3', '/_e/', '/_ex', '/a/_e']) {
      const res = await handleMedia(new Request('https://m2.reversim.com' + path, { headers: { 'user-agent': 'Spotify/8.7.10 iOS/15.3.1' } }), env, ctx);
      expect(res.status).toBe(200);
    }
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(calls).toHaveLength(1); // only the .mp3 hit is logged
    expect(calls[0][1]).toBe('ep.mp3');
  });
});

describe('parseBeacon', () => {
  const hosts = ['reversim.com'];
  const ok = (o: object) => parseBeacon(JSON.stringify(o), hosts);
  it('accepts valid input and normalizes the path', () => {
    expect(ok({ t: 'pv', p: '/a/b.html', r: 'news.ycombinator.com' })).toEqual({ t: 'pv', p: '/a/b.html', r: 'news.ycombinator.com' });
    expect(ok({ t: 'play', p: '/' })).toEqual({ t: 'play', p: '/', r: '' });
    expect(ok({ t: 'pv', p: '/index.html', r: '' })?.p).toBe('/');
    expect(ok({ t: 'pv', p: '/page/2/index.html', r: '' })?.p).toBe('/page/2');
    expect(ok({ t: 'pv', p: '/%D7%90.html', r: '' })?.p).toBe('/%D7%90.html'); // nothing decoded
  });
  it('blanks the referrer of the site itself', () => {
    expect(ok({ t: 'pv', p: '/', r: 'www.reversim.com' })?.r).toBe('');
    expect(ok({ t: 'pv', p: '/', r: 'reversim.com' })?.r).toBe('');
  });
  it('rejects bad type, path and referrer', () => {
    expect(ok({ t: 'x', p: '/' })).toBeNull();
    expect(ok({ t: 'pv' })).toBeNull();
    for (const p of ['a', '/a?x=1', '/a#h', '/a b', '//x/<script>', '/' + 'a'.repeat(201), 5]) expect(ok({ t: 'pv', p })).toBeNull();
    expect(ok({ t: 'pv', p: '/' + 'a'.repeat(200) })).not.toBeNull();
    for (const r of ['Google.com', 'a b', 'a/b', 'x'.repeat(101), 5]) expect(ok({ t: 'pv', p: '/', r })).toBeNull();
    expect(parseBeacon('[]', hosts)).toBeNull();
    expect(parseBeacon('null', hosts)).toBeNull();
  });
});
