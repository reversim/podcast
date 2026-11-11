import { describe, expect, it } from 'vitest';
import { safeEqual, verifyJwt, type Jwk } from '../src/auth';

const b64u = (b: ArrayBuffer | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function setup() {
  const kp = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey('jwk', kp.publicKey)) as Jwk;
  jwk.kid = 'k1';
  const sign = async (claims: object, kid = 'k1') => {
    const h = b64u(JSON.stringify({ alg: 'RS256', kid }));
    const p = b64u(JSON.stringify(claims));
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
    return `${h}.${p}.${b64u(sig)}`;
  };
  return { jwk, sign };
}

const opts = { aud: 'AUD', iss: 'https://t.cloudflareaccess.com', now: 1_000_000_000_000 };
const good = { aud: ['AUD'], iss: 'https://t.cloudflareaccess.com', exp: 1_000_000_100 };

describe('verifyJwt', () => {
  it('accepts a valid token', async () => {
    const { jwk, sign } = await setup();
    expect(await verifyJwt(await sign(good), [jwk], opts)).toBe(true);
  });
  it('rejects bad aud, iss, exp, kid, signature', async () => {
    const { jwk, sign } = await setup();
    expect(await verifyJwt(await sign({ ...good, aud: ['X'] }), [jwk], opts)).toBe(false);
    expect(await verifyJwt(await sign({ ...good, iss: 'https://evil' }), [jwk], opts)).toBe(false);
    expect(await verifyJwt(await sign({ ...good, exp: 1_000_000_000 }), [jwk], opts)).toBe(false);
    expect(await verifyJwt(await sign(good, 'other'), [jwk], opts)).toBe(false);
    const t = await sign(good);
    expect(await verifyJwt(t.slice(0, -4) + 'AAAA', [jwk], opts)).toBe(false);
    expect(await verifyJwt('garbage', [jwk], opts)).toBe(false);
  });
});

describe('safeEqual', () => {
  it('compares', async () => {
    expect(await safeEqual('abc', 'abc')).toBe(true);
    expect(await safeEqual('abc', 'abd')).toBe(false);
    expect(await safeEqual('', 'abd')).toBe(false);
  });
});
