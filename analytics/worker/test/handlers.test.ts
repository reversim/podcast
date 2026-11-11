import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleFeed } from '../src/feed';
import { handleMedia, measure } from '../src/media';
import type { Env } from '../src/env';

function setup(dbFails = false) {
  const calls: unknown[][] = [];
  const DB = {
    prepare: () => ({
      bind: (...a: unknown[]) => ({
        run: async () => { if (dbFails) throw new Error('d1 down'); calls.push(a); },
      }),
    }),
  };
  const env = { DB, HASH_SALT: 's', ORIGIN_MODE: 'passthrough', FEED_ORIGIN: 'https://feed.example/podcast.xml' } as unknown as Env;
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p) } as unknown as ExecutionContext;
  return { env, ctx, calls, flush: () => Promise.all(pending) };
}
const mp3 = (h: Record<string, string> = {}, init: ResponseInit = {}) =>
  new Response(init.status === 304 ? null : 'x', { status: 200, headers: { 'content-length': '5000000', ...h }, ...init });
const req = (path = '/ep.mp3', headers: Record<string, string> = {}, method = 'GET') =>
  new Request('https://m2.reversim.com' + path, { method, headers: { 'user-agent': 'Spotify/8.7.10 iOS/15.3.1', 'cf-connecting-ip': '1.2.3.4', ...headers } });

afterEach(() => vi.unstubAllGlobals());

describe('measure', () => {
  it('uses Content-Length on 200 and Content-Range on 206', () => {
    expect(measure(req(), mp3())).toEqual({ file: 'ep.mp3', bytes: 5000000, size: 5000000 });
    const r206 = mp3({ 'content-range': 'bytes 100-199/5000000', 'content-length': '100' }, { status: 206 });
    expect(measure(req(), r206)).toEqual({ file: 'ep.mp3', bytes: 100, size: 5000000 });
  });
  it('skips probes, non-mp3, non-GET and other statuses', () => {
    expect(measure(req(), mp3({ 'content-range': 'bytes 0-1/5000000', 'content-length': '2' }, { status: 206 }))).toBeNull();
    expect(measure(req('/a.jpg'), mp3())).toBeNull();
    expect(measure(req('/a.MP3'), mp3())).not.toBeNull();
    expect(measure(req('/ep.mp3', {}, 'HEAD'), mp3())).toBeNull();
    expect(measure(req(), mp3({}, { status: 304 }))).toBeNull();
    expect(measure(req(), mp3({}, { status: 404 }))).toBeNull();
  });
});

describe('handleMedia', () => {
  it('passes the origin response through and logs it', async () => {
    const { env, ctx, calls, flush } = setup();
    vi.stubGlobal('fetch', async () => mp3());
    const res = await handleMedia(req(), env, ctx);
    await flush();
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe('ep.mp3');
    expect(calls[0][2]).toMatch(/^[0-9a-f]{32}$/);
    expect(calls[0].slice(3, 5)).toEqual(['Spotify', 'app']);
  });
  it('is not affected by a logging failure', async () => {
    const { env, ctx, flush } = setup(true);
    vi.stubGlobal('fetch', async () => mp3());
    const res = await handleMedia(req(), env, ctx);
    await expect(flush()).resolves.toBeDefined();
    expect(res.status).toBe(200);
  });
  it('falls back to plain fetch when the handler throws', async () => {
    const { env, ctx } = setup();
    let n = 0;
    vi.stubGlobal('fetch', async () => { if (n++ === 0) throw new Error('boom'); return mp3(); });
    const res = await handleMedia(req(), env, ctx);
    expect(res.status).toBe(200);
    expect(n).toBe(2);
  });
});

describe('handleFeed', () => {
  it('redirects to the origin feed when the proxy fails', async () => {
    const { env, ctx } = setup();
    vi.stubGlobal('caches', { default: { match: async () => undefined, put: async () => {} } });
    vi.stubGlobal('fetch', async () => new Response('err', { status: 500 }));
    const res = await handleFeed(new Request('https://feed.reversim.com/'), env, ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://feed.example/podcast.xml');
  });
});
