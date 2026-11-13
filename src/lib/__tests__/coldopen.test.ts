import { describe, it, expect } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { parseStamp, pickClips, shiftTranscript, snapToSilence } from '../../../scripts/post-production.mjs';

describe('cold open helpers', () => {
  it('shifts transcript timestamps by the cold open length', () => {
    const t = '[00:00] **רן**: שלום\n[59:40] **אורי**: סוף [00:05] not a line start';
    expect(shiftTranscript(t, 38.2)).toBe('[00:38] **רן**: שלום\n[1:00:18] **אורי**: סוף [00:05] not a line start');
    expect(shiftTranscript(t, 0)).toBe(t);
  });
  it('parses stamps', () => {
    expect(parseStamp('24:26')).toBe(1466);
    expect(parseStamp('x')).toBeNaN();
  });
  it('snaps a cut to the nearest pause inside the limit', () => {
    const silences = [{ start: 9.5, end: 10.0 }, { start: 20.0, end: 20.6 }];
    expect(snapToSilence(10.4, silences, 'start', 1.5)).toBeCloseTo(9.8);
    expect(snapToSilence(19.6, silences, 'end', 1.5)).toBeCloseTo(20.15);
    expect(snapToSilence(15, silences, 'start', 1.5)).toBe(15);
  });
  it('picks clips in order, below the total limit, with no overlap', () => {
    const c = [{ start: 100, end: 115 }, { start: 110, end: 120 }, { start: 300, end: 320 }, { start: 500, end: 515 }, { start: 700, end: 708 }];
    expect(pickClips(c, 45, 3)).toEqual([c[0], c[2], c[4]]);
  });
});
