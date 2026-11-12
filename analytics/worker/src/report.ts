// Weekly email report. The hourly cron calls runWeeklyReport; it sends through the Resend HTTP API
// on Sunday from 08:00 Israel time. POST /api/report/send on the stats host sends one now (a test).
import { addDays, utcDay } from './lib';
import type { Env } from './env';

const VALID = `ua_type != 'bot' AND bytes >= min(size, ?3)`;

export interface Report { subject: string; html: string; text: string; from: string; to: string }
interface Line { label: string; value: number | null; prev?: number | null; note?: string }
interface Section { title: string; lines?: Line[]; rows?: [string, number][]; empty?: string }

const fmt = (n: number | null | undefined) => (n == null ? 'no data' : Math.round(n).toLocaleString('en-US'));
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** "+12 (+5%)", "-3 (-2%)", "no change", or '' when one side has no data. */
export function delta(cur: number | null | undefined, prev: number | null | undefined): string {
  if (cur == null || prev == null) return '';
  const d = Math.round(cur - prev);
  if (d === 0) return 'no change';
  const sign = d > 0 ? '+' : '-';
  const pct = prev > 0 ? ` (${sign}${Math.abs(Math.round((d / prev) * 100))}%)` : '';
  return `${sign}${Math.abs(d).toLocaleString('en-US')}${pct}`;
}

/** "reversim522-company_brain.mp3" -> 522. null for files without an episode number. */
export function episodeNumber(file: string): number | null {
  const m = /^reversim[-_ ]?0*(\d{1,4})(?!\d)/i.exec(file);
  return m ? Number(m[1]) : null;
}
const prettyFile = (file: string) => file.replace(/\.mp3$/i, '').replace(/[_-]+/g, ' ').trim();

/**
 * Episode titles by number, from the names that the daily Spotify job stores ("522 - Company brain ...").
 * The Worker cannot fetch www.reversim.com/episodes.json: a fetch to its own zone ends in a redirect loop.
 */
async function titlesByNumber(env: Env): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  try {
    const rows = (await env.DB.prepare(`SELECT name FROM sp_episodes WHERE name GLOB '[0-9]*'`).all<{ name: string }>()).results;
    for (const r of rows) {
      const m = /^0*(\d{1,4})\s*[-–:.]/.exec(r.name);
      if (m && !out.has(Number(m[1]))) out.set(Number(m[1]), r.name);
    }
  } catch (e) {
    console.warn('report: episode titles not loaded', e);
  }
  return out;
}

/** The report covers the 7 full UTC days that end yesterday, compared with the 7 days before them. */
export async function buildReport(env: Env, now = Date.now()): Promise<Report> {
  const db = env.DB;
  const to = addDays(utcDay(now), -1), from = addDays(to, -6);
  const pTo = addDays(from, -1), pFrom = addDays(pTo, -6);
  const minBytes = Number(env.MIN_BYTES) || 750000;
  const first = async <T>(sql: string, ...a: unknown[]) => { try { return await db.prepare(sql).bind(...a).first<T>(); } catch (e) { console.error('report query failed', e); return null; } };
  const all = async <T>(sql: string, ...a: unknown[]) => { try { return (await db.prepare(sql).bind(...a).all<T>()).results; } catch (e) { console.error('report query failed', e); return [] as T[]; } };

  // n = days with data in the range. null when the range has no data at all.
  const sumOf = async (table: string, cols: string[], a: string, b: string, has = '1') => {
    const r = await first<Record<string, number>>(
      `SELECT count(CASE WHEN ${has} THEN 1 END) AS n, ${cols.map((c) => `sum(${c}) AS ${c}`).join(', ')} FROM ${table} WHERE day BETWEEN ?1 AND ?2`, a, b);
    return r && r.n > 0 ? r : null;
  };
  const uniq = async (a: string, b: string) =>
    (await first<{ n: number }>(`SELECT count(DISTINCT listener) AS n FROM hits WHERE day BETWEEN ?1 AND ?2 AND ${VALID}`, a, b, minBytes))?.n ?? null;
  const platSum = async (platform: string, metric: string, a: string, b: string) => {
    const r = await first<{ n: number; v: number }>(
      `SELECT count(*) AS n, sum(value) AS v FROM platform_stats WHERE platform = ?1 AND metric = ?2 AND day BETWEEN ?3 AND ?4`, platform, metric, a, b);
    return r && r.n > 0 ? r.v : null;
  };
  const platAt = (platform: string, metric: string, day: string) =>
    first<{ day: string; value: number }>(
      `SELECT day, value FROM platform_stats WHERE platform = ?1 AND metric = ?2 AND day <= ?3 ORDER BY day DESC LIMIT 1`, platform, metric, day);

  const [dl, dlPrev, u, uPrev, eps, apps, web, webPrev, feed, feedPrev, names,
    spF, spFPrev, spStreams, spStreamsPrev, apF, apFPrev, meta, audience] = await Promise.all([
    sumOf('totals_daily', ['downloads'], from, to, 'requests > 0'), sumOf('totals_daily', ['downloads'], pFrom, pTo, 'requests > 0'),
    uniq(from, to), uniq(pFrom, pTo),
    all<{ file: string; n: number }>(`SELECT file, sum(downloads) AS n FROM ep_daily WHERE day BETWEEN ?1 AND ?2 GROUP BY file ORDER BY n DESC, file LIMIT 5`, from, to),
    all<{ key: string; n: number }>(`SELECT key, sum(downloads) AS n FROM dim_daily WHERE dim = 'app' AND day BETWEEN ?1 AND ?2 GROUP BY key ORDER BY n DESC, key LIMIT 5`, from, to),
    sumOf('web_daily', ['views', 'visitors', 'plays'], from, to), sumOf('web_daily', ['views', 'visitors', 'plays'], pFrom, pTo),
    first<{ n: number }>(`SELECT cast(round(avg(f)) AS INTEGER) AS n FROM (SELECT sum(fetchers) AS f FROM feed_daily WHERE day BETWEEN ?1 AND ?2 GROUP BY day)`, from, to),
    first<{ n: number }>(`SELECT cast(round(avg(f)) AS INTEGER) AS n FROM (SELECT sum(fetchers) AS f FROM feed_daily WHERE day BETWEEN ?1 AND ?2 GROUP BY day)`, pFrom, pTo),
    titlesByNumber(env),
    platAt('spotify', 'followers', to), platAt('spotify', 'followers', pTo),
    platSum('spotify', 'streams', from, to), platSum('spotify', 'streams', pFrom, pTo),
    platAt('apple', 'followers', to), platAt('apple', 'followers', pTo),
    all<{ key: string; value: string }>(`SELECT key, value FROM meta WHERE key IN ('spotify_last_ok', 'spotify_last_error')`),
    first<{ active_30d: number; idle_31_90d: number }>(`SELECT active_30d, idle_31_90d FROM audience_daily ORDER BY day DESC LIMIT 1`),
  ]);

  const m = new Map(meta.map((r) => [r.key, r.value]));
  const warnings: string[] = [];
  if (!dl) warnings.push('No download data for this week. Examine the Worker.');
  else if (dl.n < 7) warnings.push(`Download data exists for only ${dl.n} of 7 days.`);
  if (env.SPOTIFY_SHOW_ID) {
    const ok = Date.parse(m.get('spotify_last_ok') ?? '');
    if (m.get('spotify_last_error')) warnings.push('Spotify job error: ' + m.get('spotify_last_error')!.slice(0, 200));
    else if (!Number.isFinite(ok) || now - ok > 3 * 86400000) warnings.push('The Spotify job did not succeed in the last 3 days. The cookies are possibly expired.');
  }
  if (apF && Date.parse(to) - Date.parse(apF.day) > 35 * 86400000) warnings.push(`The Apple numbers are from ${apF.day}. Add new numbers on the dashboard.`);

  const sections: Section[] = [
    { title: 'Downloads (own measurement, without Spotify plays)', lines: [
      { label: 'Downloads', value: dl?.downloads ?? null, prev: dlPrev?.downloads },
      { label: 'Unique listeners', value: dl ? u : null, prev: dlPrev ? uPrev : null },
      ...(audience ? [{ label: 'Active listeners, last 30 days', value: audience.active_30d }] : []),
    ] },
    { title: 'Top episodes', rows: eps.map((e) => [names.get(episodeNumber(e.file) ?? -1) ?? prettyFile(e.file), e.n]), empty: 'No downloads.' },
    { title: 'Top apps', rows: apps.map((a) => [a.key, a.n]), empty: 'No downloads.' },
    { title: 'Followers', lines: [
      { label: 'Spotify', value: spF?.value ?? null, prev: spFPrev?.value },
      { label: 'Apple', value: apF?.value ?? null, prev: apFPrev && apF && apFPrev.day !== apF.day ? apFPrev.value : null, note: apF ? `as of ${apF.day}` : undefined },
      { label: 'Spotify streams this week', value: spStreams, prev: spStreamsPrev },
    ] },
    { title: 'Website and feed', lines: [
      { label: 'Page views', value: web?.views ?? null, prev: webPrev?.views },
      { label: 'Visitors (sum of daily visitors)', value: web?.visitors ?? null, prev: webPrev?.visitors },
      { label: 'Plays on the website', value: web?.plays ?? null, prev: webPrev?.plays },
      { label: 'Feed clients, average per day', value: feed?.n ?? null, prev: feedPrev?.n },
    ] },
  ];

  // Followers on all platforms: only when each platform that has numbers also has them for the week before.
  const fol = spF || apF ? (spF?.value ?? 0) + (apF?.value ?? 0) : null;
  const folPrev = (!spF || spFPrev) && (!apF || apFPrev) && (spFPrev || apFPrev) ? (spFPrev?.value ?? 0) + (apFPrev?.value ?? 0) : null;
  const tiles: Line[] = [
    { label: 'Downloads', value: dl?.downloads ?? null, prev: dlPrev?.downloads },
    { label: 'Unique listeners', value: dl ? u : null, prev: dlPrev ? uPrev : null },
    { label: 'Followers, Spotify + Apple', value: fol, prev: folPrev },
  ];
  const dash = `https://${env.STATS_HOST}`;
  const subject = `Reversim weekly stats: ${fmt(dl?.downloads)} downloads (${from} to ${to})`;
  return { subject, from, to, text: toText(sections, warnings, from, to, dash), html: toHtml(tiles, sections, warnings, from, to, dash) };
}

const lineText = (l: Line) => {
  const d = delta(l.value, l.prev);
  return `${l.label}: ${fmt(l.value)}${l.note ? ` (${l.note})` : ''}${d ? `, ${d} from the week before` : ''}`;
};

function toText(sections: Section[], warnings: string[], from: string, to: string, dash: string): string {
  const out = [`Reversim weekly stats, ${from} to ${to} (UTC days)`, ''];
  if (warnings.length) out.push('WARNINGS', ...warnings.map((w) => '- ' + w), '');
  for (const s of sections) {
    out.push(s.title.toUpperCase());
    for (const l of s.lines ?? []) out.push(lineText(l));
    if (s.rows) out.push(...(s.rows.length ? s.rows.map(([k, n], i) => `${i + 1}. ${k}: ${fmt(n)}`) : [s.empty ?? 'No data.']));
    out.push('');
  }
  out.push('Dashboard: ' + dash);
  return out.join('\n');
}

function toHtml(tiles: Line[], sections: Section[], warnings: string[], from: string, to: string, dash: string): string {
  // Fixed column widths, the same in each table, so the numbers of all sections are in one line.
  const td = 'padding:6px 12px 6px 0;border-bottom:1px solid #e3e8eb;font-size:14px;vertical-align:top';
  const num = td + ';text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums';
  const cols = '<colgroup><col><col width="80" style="width:80px"><col width="120" style="width:120px"></colgroup>';
  const row = (a: string, b: string, c = '') =>
    `<tr><td style="${td};word-break:break-word" dir="auto">${a}</td><td style="${num}"><b>${b}</b></td><td style="${td};padding-right:0;color:#5a6b73;white-space:nowrap">${c}</td></tr>`;
  let h = `<div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#16242b;max-width:600px">`;
  h += `<h2 style="margin:0 0 4px;font-size:20px">Reversim weekly stats</h2><p style="margin:0 0 16px;color:#5a6b73;font-size:13px">${from} to ${to} (UTC days). Changes are from the week before.</p>`;
  if (tiles.length) {
    const w = Math.floor(100 / tiles.length);
    h += `<table role="presentation" style="border-collapse:separate;border-spacing:0;width:100%;table-layout:fixed;margin:0 0 16px"><tr>`;
    tiles.forEach((t, i) => {
      const d = delta(t.value, t.prev);
      h += `<td width="${w}%" style="width:${w}%;padding:0 ${i < tiles.length - 1 ? 8 : 0}px 0 0;vertical-align:top"><div style="background:#e2f1f4;border-radius:6px;padding:12px 14px">`
        + `<div style="font-size:12px;color:#3d5560">${esc(t.label)}</div>`
        + `<div style="font-size:28px;font-weight:700;line-height:1.2;color:#0b7285">${fmt(t.value)}</div>`
        + `<div style="font-size:12px;color:#5a6b73">${esc(d || t.note || ' ')}</div></div></td>`;
    });
    h += '</tr></table>';
  }
  if (warnings.length) {
    h += `<div style="background:#fff4e0;border-left:4px solid #c77700;padding:10px 12px;margin:0 0 16px;font-size:14px"><b>Warnings</b><ul style="margin:6px 0 0;padding-left:18px">${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>`;
  }
  for (const s of sections) {
    h += `<h3 style="margin:18px 0 4px;font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:#0b7285">${esc(s.title)}</h3><table style="border-collapse:collapse;width:100%;table-layout:fixed">${cols}`;
    for (const l of s.lines ?? []) h += row(esc(l.label) + (l.note ? ` <span style="color:#5a6b73">(${esc(l.note)})</span>` : ''), fmt(l.value), esc(delta(l.value, l.prev)));
    if (s.rows) h += s.rows.length ? s.rows.map(([k, n]) => row(esc(k), fmt(n))).join('') : row(esc(s.empty ?? 'No data.'), '');
    h += '</table>';
  }
  h += `<p style="margin:20px 0 0;font-size:14px"><a href="${esc(dash)}" style="color:#0b7285">Open the dashboard</a></p></div>`;
  return h;
}

const UPSERT_META = `INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value`;
const TZ = 'Asia/Jerusalem';
const SEND_WEEKDAY = 'Sun', SEND_HOUR = 8;

/** True on Sunday from 08:00 Israel time. The clock follows Israel summer and winter time. */
export function isSendTime(now: number): boolean {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return get('weekday') === SEND_WEEKDAY && Number(get('hour')) >= SEND_HOUR;
}

export type SendResult = { ok: true; id: string | null; to: number } | { ok: false; error: string };

/** Builds the report and sends it through Resend. Never throws, never returns the key or the addresses. */
export async function sendReport(env: Env, now = Date.now()): Promise<SendResult> {
  try {
    const to = (env.REPORT_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!env.RESEND_API_KEY || !env.REPORT_FROM || !to.length) return { ok: false, error: 'not configured: RESEND_API_KEY, REPORT_FROM and REPORT_TO are necessary' };
    const r = await buildReport(env, now);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.REPORT_FROM, to, subject: r.subject, html: r.html, text: r.text }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.text();
    if (!res.ok) {
      let msg = body.slice(0, 200);
      try { msg = String(JSON.parse(body).message ?? msg).slice(0, 200); } catch { /* keep text */ }
      for (const secret of [env.RESEND_API_KEY, ...to]) msg = msg.split(secret).join('[redacted]');
      return { ok: false, error: `Resend HTTP ${res.status}: ${msg}` };
    }
    let id: string | null = null;
    try { id = String(JSON.parse(body).id ?? '') || null; } catch { /* no id */ }
    return { ok: true, id, to: to.length };
  } catch (e) {
    return { ok: false, error: 'send failed: ' + (e instanceof Error ? e.message : String(e)).slice(0, 200) };
  }
}

/**
 * Called by the hourly cron. Sends one report per week: on Sunday from 08:00 Israel time.
 * A failed send is tried again each hour of that Sunday. Never throws.
 */
export async function runWeeklyReport(env: Env, now = Date.now()): Promise<'skipped' | 'sent' | 'failed'> {
  try {
    if (!env.RESEND_API_KEY || !isSendTime(now)) return 'skipped';
    const week = addDays(utcDay(now), -1); // last day of the reported week
    const done = await env.DB.prepare(`SELECT value FROM meta WHERE key = 'report_sent'`).first<{ value: string }>();
    if (done?.value === week) return 'skipped';
    const r = await sendReport(env, now);
    if (r.ok) {
      await env.DB.batch([
        env.DB.prepare(UPSERT_META).bind('report_sent', week),
        env.DB.prepare(`DELETE FROM meta WHERE key = 'report_last_error'`),
      ]);
      return 'sent';
    }
    console.error('weekly report: ' + r.error);
    await env.DB.prepare(UPSERT_META).bind('report_last_error', r.error).run();
    return 'failed';
  } catch (e) {
    console.error('weekly report failed', e);
    return 'failed';
  }
}

/** POST /api/report/send on the stats host (behind Access): sends the report now, as a test. */
export async function handleReportSend(env: Env, now = Date.now()): Promise<Response> {
  const r = await sendReport(env, now);
  return Response.json(r, { status: r.ok ? 200 : 502, headers: { 'cache-control': 'no-store' } });
}
