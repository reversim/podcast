import { describe, it, expect } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { envelopeExpr, welcomeTimeline, extendToPause, parseStamp, pickClips, shiftTranscript, snapToSilence } from '../../../scripts/post-production.mjs';

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

describe('extendToPause', () => {
	const silences = [{ start: 8, end: 8.5 }, { start: 21, end: 21.6 }, { start: 30, end: 31 }];
	it('moves the end to the next pause', () => {
		expect(extendToPause({ start: 10, end: 19 }, silences, 'end', 3)).toEqual({ start: 10, end: 21.15 });
	});
	it('moves the start to the previous pause', () => {
		expect(extendToPause({ start: 10, end: 19 }, silences, 'start', 3)!.start).toBeCloseTo(8.3);
	});
	it('returns null when no pause is in range', () => {
		expect(extendToPause({ start: 10, end: 25 }, silences, 'end', 3)).toBeNull();
	});
});

describe('welcome line', () => {
	const at = (expr: string, t: number) => {
		const lt = (a: number, b: number) => (a < b ? 1 : 0);
		const iff = (c: number, a: number, b: number) => (c ? a : b);
		return new Function('t', 'lt', 'iff', `return ${expr.replace(/if\(/g, 'iff(')}`)(t, lt, iff);
	};
	it('builds a piecewise-linear expression', () => {
		const expr = envelopeExpr([[0, 0], [2, 1], [4, 1], [6, 0.5]]);
		expect(at(expr, 1)).toBeCloseTo(0.5);
		expect(at(expr, 3)).toBeCloseTo(1);
		expect(at(expr, 5)).toBeCloseTo(0.75);
		expect(at(expr, 9)).toBeCloseTo(0.5);
	});
	it('puts the hosts after the voice and keeps the music low under speech', () => {
		const w = welcomeTimeline(6);
		expect(w.hostsStart).toBeCloseTo(7.7);
		const expr = envelopeExpr(w.points);
		expect(at(expr, 3)).toBeCloseTo(0.14);          // under the welcome voice
		expect(at(expr, w.hostsStart + 2)).toBeCloseTo(0.06); // under the hosts
		expect(at(expr, w.end + 1)).toBe(0);
		for (let i = 1; i < w.points.length; i++) expect(w.points[i][0]).toBeGreaterThan(w.points[i - 1][0]);
	});
});
