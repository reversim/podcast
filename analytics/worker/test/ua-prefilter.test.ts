import { describe, expect, it } from 'vitest';
import { literalsOf } from '../src/ua';
import bots from '../vendor/bots.json';
import apps from '../vendor/apps.json';
import libraries from '../vendor/libraries.json';
import browsers from '../vendor/browsers.json';
import devices from '../vendor/devices.json';

// The literal prefilter must never reject a user agent that the regex accepts.
describe('literal prefilter', () => {
  const entries = [bots, apps, libraries, browsers, devices].flatMap((f) => f.entries as { pattern: string; examples?: string[] }[]);
  const uas = [
    ...entries.flatMap((e) => e.examples ?? []),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/119 Mobile Safari/537.36',
    'Podcasts/1650.1 CFNetwork/1333 Darwin/21.5.0',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
  ];

  it('agrees with the plain regex for every entry and every known user agent', () => {
    let checked = 0;
    for (const e of entries) {
      const re = new RegExp(e.pattern);
      const lits = literalsOf(e.pattern);
      for (const ua of uas) {
        if (!re.test(ua)) continue;
        checked++;
        if (lits && !lits.some((l) => ua.includes(l))) throw new Error(`prefilter rejects "${ua}" for /${e.pattern}/ (literals ${JSON.stringify(lits)})`);
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('skips most entries', () => {
    const none = entries.filter((e) => !literalsOf(e.pattern)).length;
    expect(none / entries.length).toBeLessThan(0.1);
  });
});
