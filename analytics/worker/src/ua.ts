// User-agent classification with the OPAWG list (vendor/, MIT). Order: bots, apps, libraries,
// browsers (first match wins); devices.json gives the device category for non-bots.
import bots from '../vendor/bots.json';
import apps from '../vendor/apps.json';
import libraries from '../vendor/libraries.json';
import browsers from '../vendor/browsers.json';
import devices from '../vendor/devices.json';

export type UaType = 'bot' | 'app' | 'library' | 'browser' | 'unknown';
export interface UaInfo { type: UaType; name: string; device: string }

interface Entry { name: string; pattern: string; category?: string; re?: RegExp | null; lits?: string[] | null }
const LISTS: [UaType, Entry[]][] = [
  ['bot', bots.entries],
  ['app', apps.entries],
  ['library', libraries.entries],
  ['browser', browsers.entries],
];
const DEVICES: Entry[] = devices.entries;
const CACHE_MAX = 5000;
const cache = new Map<string, UaInfo>();

// CPU budget: the Workers free plan allows 10 ms per request, and compiling ~950 regexes
// costs more than that. So each entry gets "literals": substrings that every match must
// contain (one per top-level alternative). A cheap `includes` check then skips almost all
// regexes. Literals are computed at module load (startup time, not request CPU time).
// Returns null when no safe literal exists; that entry always runs its regex.
function literalOf(p: string): string {
  let best = '', run = '', depth = 0;
  const flush = () => { if (run.length > best.length) best = run; run = ''; };
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '\\') { flush(); i++; continue; }
    if (c === '(' || c === '[') { flush(); depth++; continue; }
    if (c === ')' || c === ']') { depth--; continue; }
    if (depth > 0) continue;
    if (c === '?' || c === '*' || c === '{') { // previous char is optional
      run = run.slice(0, -1); flush();
      if (c === '{') while (i < p.length && p[i] !== '}') i++;
      continue;
    }
    if ('^$.+'.includes(c)) { flush(); continue; }
    run += c;
  }
  flush();
  return best;
}

function splitTopLevel(p: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '\\') { cur += c + (p[++i] ?? ''); continue; }
    if (c === '(' || c === '[') depth++; else if (c === ')' || c === ']') depth--;
    if (c === '|' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function literalsOf(pattern: string): string[] | null {
  const lits = splitTopLevel(pattern).map(literalOf);
  return lits.every((l) => l.length >= 2) ? lits : null;
}

for (const e of [...LISTS.flatMap(([, entries]) => entries), ...DEVICES]) e.lits = literalsOf(e.pattern);

// Each regex compiles on first use only.
function test(e: Entry, ua: string): boolean {
  if (e.lits && !e.lits.some((l) => ua.includes(l))) return false;
  if (e.re === undefined) {
    try { e.re = new RegExp(e.pattern); } catch { e.re = null; }
  }
  return !!e.re && e.re.test(ua);
}

function compute(ua: string): UaInfo {
  let type: UaType = 'unknown';
  let name = 'Unknown';
  outer: for (const [t, entries] of LISTS) {
    for (const e of entries) {
      if (test(e, ua)) { type = t; name = e.name; break outer; }
    }
  }
  let device = 'unknown';
  if (type !== 'bot') {
    const d = DEVICES.find((e) => test(e, ua));
    if (d?.category) device = d.category;
  }
  return { type, name, device };
}

export function classify(ua: string | null | undefined): UaInfo {
  if (!ua) return { type: 'unknown', name: 'Unknown', device: 'unknown' };
  const hit = cache.get(ua);
  if (hit) return hit;
  const info = compute(ua);
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(ua, info);
  return info;
}
