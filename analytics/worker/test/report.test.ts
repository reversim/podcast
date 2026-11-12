// @ts-nocheck
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReport, delta, isSendTime, runWeeklyReport, sendReport } from '../src/report';

const NOW = Date.UTC(2026, 10, 22, 6, 7); // Sunday 2026-11-22; week = 11-15..11-21, before = 11-08..11-14

function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    all: async () => ({ results: sql.prepare(q).all(...args) }),
    first: async () => sql.prepare(q).get(...args) ?? null,
    run: async () => { sql.prepare(q).run(...args); },
  });
  return { sql, DB: { prepare: (q) => stmt(q) } };
}
const envOf = (DB, o = {}) => ({ DB, STATS_HOST: 'stats.reversim.com', MIN_BYTES: '750000', ...o });
const titles = (list = [{ file: 'a.mp3', title: '522 - <Brain> & co' }]) =>
  vi.stubGlobal('fetch', async () => Response.json(list));

function seed(sql) {
  const days = (a, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(a) + i * 86400000).toISOString().slice(0, 10));
  for (const d of days('2026-11-15', 7)) {
    sql.prepare(`INSERT INTO totals_daily VALUES (?, 100, 90, 150, 10, 2)`).run(d);
    sql.prepare(`INSERT INTO ep_daily VALUES (?, 'a.mp3', 70, 60)`).run(d);
    sql.prepare(`INSERT INTO ep_daily VALUES (?, 'b.mp3', 30, 30)`).run(d);
    sql.prepare(`INSERT INTO dim_daily VALUES (?, 'app', 'Apple Podcasts', 100)`).run(d);
    sql.prepare(`INSERT INTO web_daily VALUES (?, 40, 30, 1)`).run(d);
    sql.prepare(`INSERT INTO feed_daily VALUES (?, 'Overcast', 130, 400, 0)`).run(d);
    sql.prepare(`INSERT INTO platform_stats VALUES ('spotify', 'streams', ?, 50)`).run(d);
    // the same listener on each day: 1 unique; a bot and a short request do not count
    sql.prepare(`INSERT INTO hits VALUES (?, 'a.mp3', 'L1', 'x', 'app', 'phone', 'IL', 5000000, 5000000, 1, 0)`).run(d);
    sql.prepare(`INSERT INTO hits VALUES (?, 'a.mp3', 'BOT', 'x', 'bot', 'phone', 'IL', 5000000, 5000000, 1, 0)`).run(d);
    sql.prepare(`INSERT INTO hits VALUES (?, 'a.mp3', 'SHORT', 'x', 'app', 'phone', 'IL', 5000000, 1000, 1, 0)`).run(d);
  }
  sql.prepare(`INSERT INTO hits VALUES ('2026-11-21', 'b.mp3', 'L2', 'x', 'app', 'phone', 'IL', 5000000, 5000000, 1, 0)`).run();
  for (const d of days('2026-11-08', 7)) sql.prepare(`INSERT INTO totals_daily VALUES (?, 80, 70, 100, 5, 1)`).run(d);
  sql.prepare(`INSERT INTO platform_stats VALUES ('spotify', 'followers', '2026-11-14', 1990)`).run();
  sql.prepare(`INSERT INTO platform_stats VALUES ('spotify', 'followers', '2026-11-21', 2000)`).run();
  sql.prepare(`INSERT INTO platform_stats VALUES ('apple', 'followers', '2026-11-11', 973)`).run();
  sql.prepare(`INSERT INTO meta VALUES ('spotify_last_ok', '2026-11-22T04:07:00Z')`).run();
}

afterEach(() => vi.unstubAllGlobals());

describe('delta', () => {
  it('formats changes', () => {
    expect(delta(110, 100)).toBe('+10 (+10%)');
    expect(delta(90, 100)).toBe('-10 (-10%)');
    expect(delta(5, 5)).toBe('no change');
    expect(delta(5, 0)).toBe('+5');
    expect(delta(5, null)).toBe('');
    expect(delta(null, 5)).toBe('');
  });
});

describe('buildReport', () => {
  it('sums the week that ends yesterday and compares with the week before', async () => {
    const { sql, DB } = makeDb(); seed(sql); titles();
    const r = await buildReport(envOf(DB, { SPOTIFY_SHOW_ID: 's' }), NOW);
    expect([r.from, r.to]).toEqual(['2026-11-15', '2026-11-21']);
    expect(r.subject).toBe('Reversim weekly stats: 700 downloads (2026-11-15 to 2026-11-21)');
    expect(r.text).toContain('Downloads: 700, +140 (+25%) from the week before');
    expect(r.text).toContain('Unique listeners: 2');
    expect(r.text).toContain('1. 522 - <Brain> & co: 490');
    expect(r.text).toContain('2. b.mp3: 210'); // no title: file name
    expect(r.text).toContain('Spotify: 2,000, +10 (+1%) from the week before');
    expect(r.text).toContain('Apple: 973 (as of 2026-11-11)');
    expect(r.text).toContain('Spotify streams this week: 350');
    expect(r.text).toContain('Page views: 280');
    expect(r.text).toContain('Feed clients, average per day: 130');
    expect(r.text).not.toContain('WARNINGS');
    expect(r.text).toContain('https://stats.reversim.com');
  });
  it('escapes HTML in titles', async () => {
    const { sql, DB } = makeDb(); seed(sql); titles();
    const r = await buildReport(envOf(DB), NOW);
    expect(r.html).toContain('522 - &lt;Brain&gt; &amp; co');
    expect(r.html).not.toContain('<Brain>');
  });
  it('works on an empty database and when the title fetch fails', async () => {
    const { DB } = makeDb();
    vi.stubGlobal('fetch', async () => { throw new Error('down'); });
    const r = await buildReport(envOf(DB), NOW);
    expect(r.subject).toContain('no data downloads');
    expect(r.text).toContain('No download data for this week');
    expect(r.text).toContain('Unique listeners: no data');
  });
  it('warns about partial data, Spotify errors and old Apple numbers', async () => {
    const { sql, DB } = makeDb(); seed(sql); titles([]);
    sql.prepare(`DELETE FROM totals_daily WHERE day = '2026-11-15'`).run();
    sql.prepare(`INSERT INTO meta VALUES ('spotify_last_error', 'Spotify session expired')`).run();
    sql.prepare(`UPDATE platform_stats SET day = '2026-09-01' WHERE platform = 'apple'`).run();
    const r = await buildReport(envOf(DB, { SPOTIFY_SHOW_ID: 's' }), NOW);
    expect(r.text).toContain('only 6 of 7 days');
    expect(r.text).toContain('Spotify job error: Spotify session expired');
    expect(r.text).toContain('The Apple numbers are from 2026-09-01');
  });
  it('warns when the Spotify job is stale', async () => {
    const { sql, DB } = makeDb(); seed(sql); titles([]);
    sql.prepare(`UPDATE meta SET value = '2026-11-10T04:07:00Z' WHERE key = 'spotify_last_ok'`).run();
    expect((await buildReport(envOf(DB, { SPOTIFY_SHOW_ID: 's' }), NOW)).text).toContain('did not succeed in the last 3 days');
  });
});

describe('isSendTime', () => {
  it('is true on Sunday from 08:00 Israel time, in winter and summer', () => {
    expect(isSendTime(Date.UTC(2026, 10, 22, 5, 7))).toBe(false); // winter (UTC+2): 07:07
    expect(isSendTime(Date.UTC(2026, 10, 22, 6, 7))).toBe(true);  // 08:07
    expect(isSendTime(Date.UTC(2026, 10, 22, 21, 7))).toBe(true); // 23:07
    expect(isSendTime(Date.UTC(2026, 10, 22, 22, 7))).toBe(false); // Monday 00:07
    expect(isSendTime(Date.UTC(2026, 10, 21, 6, 7))).toBe(false); // Saturday
    expect(isSendTime(Date.UTC(2026, 6, 5, 4, 7))).toBe(false);   // summer (UTC+3): 07:07
    expect(isSendTime(Date.UTC(2026, 6, 5, 5, 7))).toBe(true);    // 08:07
  });
});

describe('sending', () => {
  const RKEY = 're_SECRETkey1234567890';
  const cfg = { RESEND_API_KEY: RKEY, REPORT_FROM: 'Reversim Stats <stats@mail.example.com>', REPORT_TO: 'a@example.com, b@example.com' };
  function net(resend = () => Response.json({ id: 'msg_1' })) {
    const sent = [];
    vi.stubGlobal('fetch', async (url, init) => {
      if (String(url).includes('episodes.json')) return Response.json([]);
      sent.push({ url: String(url), init, body: JSON.parse(init.body) });
      return resend();
    });
    return sent;
  }
  it('posts the report to Resend', async () => {
    const { sql, DB } = makeDb(); seed(sql); const sent = net();
    expect(await sendReport(envOf(DB, cfg), NOW)).toEqual({ ok: true, id: 'msg_1', to: 2 });
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('https://api.resend.com/emails');
    expect(sent[0].init.headers.authorization).toBe('Bearer ' + RKEY);
    expect(sent[0].body).toMatchObject({ from: cfg.REPORT_FROM, to: ['a@example.com', 'b@example.com'], subject: expect.stringContaining('700 downloads') });
    expect(sent[0].body.html).toContain('Reversim weekly stats');
  });
  it('does not send when the configuration is missing', async () => {
    const { DB } = makeDb(); const sent = net();
    for (const k of Object.keys(cfg)) expect((await sendReport(envOf(DB, { ...cfg, [k]: '' }), NOW)).ok).toBe(false);
    expect(sent).toHaveLength(0);
  });
  it('reports a Resend error without the key or the addresses', async () => {
    const { DB } = makeDb();
    net(() => Response.json({ message: `bad key ${RKEY} for a@example.com` }, { status: 403 }));
    const r = await sendReport(envOf(DB, cfg), NOW);
    expect(r).toEqual({ ok: false, error: 'Resend HTTP 403: bad key [redacted] for [redacted]' });
  });
  it('sends one time per week and tries again after a failure', async () => {
    const { sql, DB } = makeDb(); seed(sql);
    DB.batch = async (s) => { for (const x of s) await x.run(); };
    const env = envOf(DB, cfg);
    let fail = true;
    const sent = net(() => (fail ? new Response('down', { status: 500 }) : Response.json({ id: 'm' })));
    expect(await runWeeklyReport(env, Date.UTC(2026, 10, 22, 5, 7))).toBe('skipped'); // before 08:00
    expect(await runWeeklyReport(env, NOW)).toBe('failed');
    expect(sql.prepare(`SELECT value FROM meta WHERE key = 'report_last_error'`).get().value).toContain('Resend HTTP 500');
    fail = false;
    expect(await runWeeklyReport(env, NOW + 3600000)).toBe('sent');
    expect(sql.prepare(`SELECT value FROM meta WHERE key = 'report_sent'`).get().value).toBe('2026-11-21');
    expect(sql.prepare(`SELECT count(*) AS n FROM meta WHERE key = 'report_last_error'`).get().n).toBe(0);
    expect(await runWeeklyReport(env, NOW + 7200000)).toBe('skipped');
    expect(sent).toHaveLength(2);
    expect(await runWeeklyReport(env, NOW + 7 * 86400000)).toBe('sent'); // next Sunday
  });
  it('does nothing without a Resend key', async () => {
    const { DB } = makeDb(); const sent = net();
    expect(await runWeeklyReport(envOf(DB), NOW)).toBe('skipped');
    expect(sent).toHaveLength(0);
  });
});
