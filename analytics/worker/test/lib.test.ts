import { describe, expect, it } from 'vitest';
import {
  isValidDownload, listenerId, normalizeIp, notModified, parseContentRange, parseRange, parseSubscribers,
} from '../src/lib';

describe('parseRange', () => {
  it('parses a-b, a-, -n', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=900-', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 });
  });
  it('clamps the end and oversize suffix', () => {
    expect(parseRange('bytes=990-5000', 1000)).toEqual({ start: 990, end: 999 });
    expect(parseRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });
  it('flags unsatisfiable ranges', () => {
    expect(parseRange('bytes=1000-', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=2000-3000', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=0-1', 0)).toBe('unsatisfiable');
  });
  it('ignores missing, invalid and multi ranges', () => {
    expect(parseRange(null, 1000)).toBeNull();
    expect(parseRange('items=0-5', 1000)).toBeNull();
    expect(parseRange('bytes=5-2', 1000)).toBeNull();
    expect(parseRange('bytes=0-1,5-9', 1000)).toBeNull();
    expect(parseRange('bytes=-', 1000)).toBeNull();
  });
  it('parses Content-Range', () => {
    expect(parseContentRange('bytes 0-99/1000')).toEqual({ start: 0, end: 99, total: 1000 });
    expect(parseContentRange('bytes 0-99/*')).toEqual({ start: 0, end: 99, total: null });
    expect(parseContentRange('nope')).toBeNull();
  });
});

describe('normalizeIp', () => {
  it('keeps IPv4', () => expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7'));
  it('truncates IPv6 to /64 in any notation', () => {
    const a = normalizeIp('2001:db8:1:2:aaaa:bbbb:cccc:dddd');
    expect(a).toBe('2001:db8:1:2::/64');
    expect(normalizeIp('2001:0DB8:0001:0002::1')).toBe(a);
    expect(normalizeIp('2001:db8:1:2::')).toBe(a);
    expect(normalizeIp('2001:db8:1:3::1')).not.toBe(a);
    expect(normalizeIp('2001:db8::1')).toBe('2001:db8:0:0::/64');
  });
  it('maps IPv4-in-IPv6 to IPv4 and tolerates junk', () => {
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeIp('')).toBe('');
    expect(normalizeIp(null)).toBe('');
    expect(normalizeIp('zz::zz::1')).toBe('zz::zz::1');
  });
});

describe('listenerId', () => {
  it('is 32 hex chars and stable', async () => {
    const a = await listenerId('salt', '2001:db8:1:2::5', 'UA/1');
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(await listenerId('salt', '2001:db8:1:2::5', 'UA/1')).toBe(a);
  });
  it('same /64 same id; different salt, ip or ua differ', async () => {
    const a = await listenerId('salt', '2001:db8:1:2::5', 'UA/1');
    expect(await listenerId('salt', '2001:db8:1:2:9::7', 'UA/1')).toBe(a);
    expect(await listenerId('salt2', '2001:db8:1:2::5', 'UA/1')).not.toBe(a);
    expect(await listenerId('salt', '2001:db8:1:9::5', 'UA/1')).not.toBe(a);
    expect(await listenerId('salt', '2001:db8:1:2::5', 'UA/2')).not.toBe(a);
  });
  it('matches the documented formula', async () => {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('s|1.2.3.4|ua'));
    const h = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    expect(await listenerId('s', '1.2.3.4', 'ua')).toBe(h);
  });
});

describe('parseSubscribers', () => {
  it('reads counts', () => {
    expect(parseSubscribers('Overcast/1.0 Podcast Sync (+http://overcast.fm/; iOS podcast app; 1234 subscribers)')).toBe(1234);
    expect(parseSubscribers('Feedly/1.0 (+http://www.feedly.com/fetcher.html; 1 subscriber)')).toBe(1);
    expect(parseSubscribers('X 25  SUBSCRIBERS')).toBe(25);
  });
  it('returns null otherwise', () => {
    expect(parseSubscribers('Spotify/8.7.10')).toBeNull();
    expect(parseSubscribers(null)).toBeNull();
  });
});

describe('isValidDownload', () => {
  const min = 750000;
  it('needs a non-bot', () => {
    expect(isValidDownload({ ua_type: 'bot', bytes: 5_000_000, size: 5_000_000 }, min)).toBe(false);
    expect(isValidDownload({ ua_type: 'app', bytes: 5_000_000, size: 5_000_000 }, min)).toBe(true);
  });
  it('needs min(size, MIN_BYTES) bytes', () => {
    expect(isValidDownload({ ua_type: 'app', bytes: 749_999, size: 5_000_000 }, min)).toBe(false);
    expect(isValidDownload({ ua_type: 'app', bytes: 750_000, size: 5_000_000 }, min)).toBe(true);
    expect(isValidDownload({ ua_type: 'app', bytes: 500_000, size: 500_000 }, min)).toBe(true); // small file
    expect(isValidDownload({ ua_type: 'unknown', bytes: 499_999, size: 500_000 }, min)).toBe(false);
  });
});

describe('notModified', () => {
  it('handles ETag and dates', () => {
    expect(notModified(new Headers({ 'if-none-match': '"a", "b"' }), '"b"', null)).toBe(true);
    expect(notModified(new Headers({ 'if-none-match': 'W/"b"' }), '"b"', null)).toBe(true);
    expect(notModified(new Headers({ 'if-none-match': '"c"' }), '"b"', null)).toBe(false);
    const lm = 'Wed, 01 Jan 2025 00:00:00 GMT';
    expect(notModified(new Headers({ 'if-modified-since': lm }), null, lm)).toBe(true);
    expect(notModified(new Headers(), '"b"', lm)).toBe(false);
  });
});
