// Pure helpers (no Worker APIs except WebCrypto), unit tested in test/.

export type ByteRange = { start: number; end: number }; // inclusive

/** Parse a Range header. null = ignore the header (serve 200), 'unsatisfiable' = 416. */
export function parseRange(header: string | null, size: number): ByteRange | 'unsatisfiable' | null {
  if (!header) return null;
  const m = /^bytes=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(header.trim());
  if (!m) return null; // other units, multi-range, junk: ignore
  const [, a, b] = m;
  if (a === '' && b === '') return null;
  if (a === '') {
    const n = Number(b); // suffix: last n bytes
    if (n === 0 || size === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(a);
  if (start >= size) return 'unsatisfiable';
  if (b === '') return { start, end: size - 1 };
  const end = Number(b);
  if (end < start) return null; // syntactically invalid: ignore
  return { start, end: Math.min(end, size - 1) };
}

/** Parse "bytes 0-99/1234". total is null when "*". */
export function parseContentRange(h: string | null): { start: number; end: number; total: number | null } | null {
  const m = h ? /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(h.trim()) : null;
  if (!m) return null;
  return { start: Number(m[1]), end: Number(m[2]), total: m[3] === '*' ? null : Number(m[3]) };
}

/** IPv4 unchanged. IPv6 reduced to its /64 prefix, in one canonical text form. */
export function normalizeIp(raw: string | null | undefined): string {
  const ip = (raw ?? '').trim().split('%')[0].toLowerCase();
  if (!ip.includes(':')) return ip;
  let groups: number[] | null = expandIPv6(ip);
  if (!groups) return ip;
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`; // IPv4-mapped
  }
  return groups.slice(0, 4).map((g) => g.toString(16)).join(':') + '::/64';
}

function expandIPv6(ip: string): number[] | null {
  let s = ip;
  const v4 = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(s);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    s = s.slice(0, v4.index) + ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16);
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const parts = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  const nums = parts.map((p) => (/^[0-9a-f]{1,4}$/.test(p) ? parseInt(p, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

/** First 32 hex chars of SHA-256(salt|ip|ua). IPv6 is truncated to /64 first. */
export async function listenerId(salt: string, ip: string | null, ua: string | null): Promise<string> {
  const data = new TextEncoder().encode(`${salt}|${normalizeIp(ip)}|${ua ?? ''}`);
  return hex(await crypto.subtle.digest('SHA-256', data)).slice(0, 32);
}

export function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** "1234 subscribers" in a feed-fetcher UA, else null. */
export function parseSubscribers(ua: string | null): number | null {
  const m = /(\d+)\s+subscribers?/i.exec(ua ?? '');
  return m ? Number(m[1]) : null;
}

/** A (day,file,listener) key counts as a download when it is not a bot and got enough bytes. */
export function isValidDownload(row: { ua_type: string; bytes: number; size: number }, minBytes: number): boolean {
  return row.ua_type !== 'bot' && row.bytes >= Math.min(row.size, minBytes);
}

export function utcDay(d: Date | number = new Date()): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
}

/** Does the request's If-None-Match / If-Modified-Since say the client copy is current? */
export function notModified(h: Headers, etag: string | null, lastModified: string | null): boolean {
  const inm = h.get('if-none-match');
  if (inm) {
    if (!etag) return false;
    const strip = (t: string) => t.trim().replace(/^W\//, '');
    return inm.trim() === '*' || inm.split(',').some((t) => strip(t) === strip(etag));
  }
  const ims = h.get('if-modified-since');
  if (ims && lastModified) {
    const a = Date.parse(ims), b = Date.parse(lastModified);
    return !Number.isNaN(a) && !Number.isNaN(b) && b <= a;
  }
  return false;
}
