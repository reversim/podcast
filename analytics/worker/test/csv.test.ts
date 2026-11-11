// @ts-nocheck
// Tests the CSV parser and column detection embedded in dashboard/index.html (between csv:start and csv:end).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../dashboard/index.html', import.meta.url), 'utf8');
const m = /\/\* csv:start \*\/([\s\S]*?)\/\* csv:end \*\//.exec(html);
if (!m) throw new Error('csv markers not found');
/* eslint-disable-next-line @typescript-eslint/no-implied-eval */
const lib = new Function(`${m[1]}; return { parseCsv, csvDetectDelim, parseNumberCell, parseDateCell, csvResolveDate, csvDateOrder, guessMetric, sanitizeMetric, analyzeCsv, csvBuildRows };`)() as any;
const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes and embedded newlines', () => {
    expect(lib.parseCsv('a,b\n"x, y","he said ""hi"""\n"line1\nline2",3\n')).toEqual([
      ['a', 'b'], ['x, y', 'he said "hi"'], ['line1\nline2', '3']]);
  });
  it('handles CRLF, CR, BOM and blank lines', () => {
    expect(lib.parseCsv('﻿a,b\r\n1,2\r\n\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    expect(lib.parseCsv('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('detects semicolon and tab delimiters', () => {
    expect(lib.csvDetectDelim('a;b;c\n1;2;3')).toBe(';');
    expect(lib.csvDetectDelim('a\tb\n1\t2')).toBe('\t');
    expect(lib.csvDetectDelim('"a;b",c\n1,2')).toBe(',');
    expect(lib.parseCsv('d;n\n2026-01-02;1,5')).toEqual([['d', 'n'], ['2026-01-02', '1,5']]);
    expect(lib.parseCsv('d\tn\n2026-01-02\t7')).toEqual([['d', 'n'], ['2026-01-02', '7']]);
  });
});

describe('parseNumberCell', () => {
  it.each([['1,234', 1234], ['1,234,567', 1234567], ['1 234', 1234], ['1234.5', 1234.5], ['1.234,5', 1234.5], ['1.234.567', 1234567], ['12,5', 12.5], ['0', 0], ['-3', -3], ['+7', 7]])('%s', (s, v) => expect(lib.parseNumberCell(s)).toBe(v));
  it.each(['', 'abc', '12%', '2026-01-02', '1,23,4'])('rejects %j', (s) => expect(lib.parseNumberCell(s)).toBeNull());
});

describe('dates', () => {
  it.each([
    ['2026-11-01', '2026-11-01'], ['2026-11-01T10:20:30Z', '2026-11-01'], ['2026-11-01 00:00:00', '2026-11-01'],
    ['Nov 1, 2026', '2026-11-01'], ['November 1, 2026', '2026-11-01'], ['1 Nov 2026', '2026-11-01'],
    ['11/01/2026', '2026-11-01'], ['2026/11/01', '2026-11-01'],
  ])('%s', (s, iso) => expect(lib.csvResolveDate(s, 'mdy')).toBe(iso));
  it('resolves NN/NN/YYYY by order', () => {
    expect(lib.csvResolveDate('03/04/2026', 'mdy')).toBe('2026-03-04');
    expect(lib.csvResolveDate('03/04/2026', 'dmy')).toBe('2026-04-03');
    expect(lib.csvResolveDate('25/12/2026', 'dmy')).toBe('2026-12-25');
    expect(lib.csvResolveDate('25/12/2026', 'mdy')).toBeNull();
  });
  it('rejects fake dates', () => {
    expect(lib.csvResolveDate('2026-02-30', 'mdy')).toBeNull();
    expect(lib.csvResolveDate('hello', 'mdy')).toBeNull();
  });
  it('decides day/month order from values, or reports ambiguity', () => {
    expect(lib.csvDateOrder(['01/02/2026', '13/02/2026'])).toEqual({ order: 'dmy', ambiguous: false });
    expect(lib.csvDateOrder(['01/02/2026', '02/13/2026'])).toEqual({ order: 'mdy', ambiguous: false });
    expect(lib.csvDateOrder(['01/02/2026', '03/04/2026'])).toEqual({ order: 'mdy', ambiguous: true });
    expect(lib.csvDateOrder(['05/05/2026'])).toEqual({ order: 'mdy', ambiguous: false });
    expect(lib.csvDateOrder(['2026-01-02'])).toEqual({ order: 'mdy', ambiguous: false });
  });
});

describe('analyzeCsv', () => {
  it('maps the Spotify-like sample', () => {
    const an = lib.analyzeCsv(fx('spotify-sample.csv'));
    expect(an.header).toBe(true);
    expect(an.dateCol).toBe(0);
    expect(an.columns.map((c: any) => [c.name, c.guess])).toEqual([['Followers', 'followers'], ['Streams', 'streams'], ['Listeners', 'listeners'], ['Starts', 'starts']]);
    const b = lib.csvBuildRows(an, { 1: 'followers', 2: 'streams' }, 'spotify', { order: 'mdy', today: '2026-11-11' });
    expect(b.rows).toHaveLength(6);
    expect(b.rows[0]).toEqual({ day: '2026-11-01', platform: 'spotify', metric: 'followers', value: 2310 });
    expect(b.skipped).toBe(0);
  });
  it('maps the Apple-like sample, engaged before listeners, order settled by 13', () => {
    const an = lib.analyzeCsv(fx('apple-sample.csv'));
    expect(an.columns.map((c: any) => c.guess)).toEqual(['plays', 'listeners', 'engaged_listeners', 'followers']);
    expect(an.ambiguous).toBe(false);
    expect(an.order).toBe('mdy');
  });
  it('skips future dates and bad rows', () => {
    const an = lib.analyzeCsv('Date,Followers\n2026-11-01,10\n2026-12-25,11\nnope,12\n2026-11-02,\n');
    const b = lib.csvBuildRows(an, { 1: 'followers' }, 'apple', { order: 'mdy', today: '2026-11-11' });
    expect(b.rows.map((r: any) => r.day)).toEqual(['2026-11-01']);
    expect(b.skipped).toBe(3);
  });
  it('asks for a date on a single totals row', () => {
    const an = lib.analyzeCsv('Followers,Listeners\n"1,234",567\n');
    expect(an.needsDate).toBe(true);
    const b = lib.csvBuildRows(an, { 0: 'followers', 1: 'listeners' }, 'spotify', { order: 'mdy', date: '2026-11-10', today: '2026-11-11' });
    expect(b.rows.map((r: any) => [r.metric, r.value, r.day])).toEqual([['followers', 1234, '2026-11-10'], ['listeners', 567, '2026-11-10']]);
  });
  it('errors on many rows without dates, and on no numbers', () => {
    expect(lib.analyzeCsv('Followers\n1\n2\n').error).toMatch(/date/i);
    expect(lib.analyzeCsv('Date,Name\n2026-01-01,abc\n').error).toMatch(/numeric/i);
    expect(lib.analyzeCsv('').error).toBeTruthy();
  });
  it('detects a date column by values when the header says nothing, and header-less files', () => {
    const an = lib.analyzeCsv('Period,Followers\n2026-11-01,5\n2026-11-02,6\n');
    expect(an.dateCol).toBe(0);
    const nh = lib.analyzeCsv('2026-11-01,5\n2026-11-02,6\n');
    expect(nh.header).toBe(false);
    expect(nh.dataRows).toHaveLength(2);
  });
  it('flags ambiguous slash dates', () => {
    const an = lib.analyzeCsv('Date;Plays\n01/02/2026;5\n03/04/2026;6\n');
    expect(an.ambiguous).toBe(true);
    expect(an.delim).toBe(';');
  });
  it('dedups the same day, last wins', () => {
    const an = lib.analyzeCsv('Date,Plays\n2026-11-01,5\n2026-11-01,9\n');
    const b = lib.csvBuildRows(an, { 1: 'plays' }, 'apple', { order: 'mdy' });
    expect(b.rows).toHaveLength(1); expect(b.rows[0].value).toBe(9);
  });
});

describe('sanitizeMetric / guessMetric', () => {
  it('sanitizes to the server pattern', () => {
    expect(lib.sanitizeMetric(' Completion Rate % ')).toBe('completion_rate');
    expect(lib.sanitizeMetric('x'.repeat(60))).toHaveLength(40);
    expect(lib.sanitizeMetric('???')).toBe('');
  });
  it('guesses', () => {
    expect(lib.guessMetric('Total Followers')).toBe('followers');
    expect(lib.guessMetric('Engaged listeners')).toBe('engaged_listeners');
    expect(lib.guessMetric('Impressions')).toBe('impressions');
    expect(lib.guessMetric('Foo')).toBe('');
  });
});
