// GET /api/stats. Reads rollup tables only (never `hits`).
import { addDays, utcDay } from './lib';
import type { Env } from './env';

export async function buildStats(env: Env, days: number, now = Date.now()) {
  const to = utcDay(now);
  const from = addDays(to, -(days - 1));
  const db = env.DB;
  const all = async <T>(sql: string, ...args: unknown[]) =>
    (await db.prepare(sql).bind(...args).all<T>()).results;
  const dim = (d: string) => all<{ key: string; downloads: number }>(
    `SELECT key, sum(downloads) AS downloads FROM dim_daily WHERE dim = ?1 AND day BETWEEN ?2 AND ?3
     GROUP BY key ORDER BY downloads DESC, key`, d, from, to);

  const [daily, monthly, episodes, episode_daily, apps, countries, devices, apps_daily,
    audLatest, audHistory, feedDaily, feedApps, feedSubs] = await Promise.all([
    all(`SELECT day, downloads, listeners, requests, bot_requests, unqualified FROM totals_daily
         WHERE day BETWEEN ?1 AND ?2 ORDER BY day`, from, to),
    all(`SELECT month, downloads, listeners FROM totals_monthly ORDER BY month`),
    // d1/d7/d30: downloads on days 0, 0-6, 0-29 counted from the file's first day with data.
    all(`WITH f AS (SELECT file, min(day) AS first_day FROM ep_daily GROUP BY file)
         SELECT e.file AS file, sum(e.downloads) AS total, f.first_day AS first_day,
           coalesce(sum(CASE WHEN julianday(e.day) - julianday(f.first_day) < 1 THEN e.downloads END), 0) AS d1,
           coalesce(sum(CASE WHEN julianday(e.day) - julianday(f.first_day) < 7 THEN e.downloads END), 0) AS d7,
           coalesce(sum(CASE WHEN julianday(e.day) - julianday(f.first_day) < 30 THEN e.downloads END), 0) AS d30,
           coalesce(sum(CASE WHEN e.day BETWEEN ?1 AND ?2 THEN e.downloads END), 0) AS in_range
         FROM ep_daily e JOIN f ON f.file = e.file GROUP BY e.file ORDER BY f.first_day DESC, e.file`, from, to),
    all(`SELECT day, file, downloads FROM ep_daily WHERE day BETWEEN ?1 AND ?2 ORDER BY day, file`, from, to),
    dim('app'), dim('country'), dim('device'),
    all(`SELECT day, key, downloads FROM dim_daily WHERE dim = 'app' AND day BETWEEN ?1 AND ?2 ORDER BY day, key`, from, to),
    all<{ active_30d: number; idle_31_90d: number }>(
      `SELECT active_30d, idle_31_90d FROM audience_daily ORDER BY day DESC LIMIT 1`),
    all(`SELECT day, active_30d, idle_31_90d FROM audience_daily WHERE day BETWEEN ?1 AND ?2 ORDER BY day`, from, to),
    all(`SELECT day, sum(fetchers) AS fetchers, sum(reqs) AS requests FROM feed_daily
         WHERE day BETWEEN ?1 AND ?2 GROUP BY day ORDER BY day`, from, to),
    // Average daily fetchers per app over the days that app was seen in the range.
    all(`SELECT app AS key, cast(round(avg(fetchers)) AS INTEGER) AS fetchers FROM feed_daily
         WHERE day BETWEEN ?1 AND ?2 GROUP BY app ORDER BY fetchers DESC, app`, from, to),
    all(`SELECT app AS key, subs AS subscribers FROM feed_daily
         WHERE subs > 0 AND day = (SELECT max(day) FROM feed_daily WHERE subs > 0) ORDER BY subs DESC, app`),
  ]);

  // The web tables may not exist yet on a DB that has not re-applied schema.sql: never break the API for it.
  const web = await Promise.all([
    all(`SELECT day, views, visitors, plays FROM web_daily WHERE day BETWEEN ?1 AND ?2 ORDER BY day`, from, to),
    // visitors = sum of daily unique visitors, so a returning visitor counts once per day.
    all(`SELECT path, sum(views) AS views, sum(visitors) AS visitors, sum(plays) AS plays FROM pages_daily
         WHERE day BETWEEN ?1 AND ?2 GROUP BY path ORDER BY views DESC, path LIMIT 100`, from, to),
    all(`SELECT ref AS key, sum(visitors) AS visitors FROM ref_daily WHERE day BETWEEN ?1 AND ?2
         GROUP BY ref ORDER BY visitors DESC, ref LIMIT 20`, from, to),
  ]).then(([d, pages, referrers]) => ({ daily: d, pages, referrers }))
    .catch((e) => { console.error('web stats failed', e); return { daily: [], pages: [], referrers: [] }; });

  return {
    generated_at: new Date(now).toISOString(),
    range: { from, to },
    daily, monthly, episodes, episode_daily, apps, countries, devices, apps_daily,
    audience: {
      active_30d: audLatest[0]?.active_30d ?? 0,
      idle_31_90d: audLatest[0]?.idle_31_90d ?? 0,
      history: audHistory,
    },
    feed: { daily: feedDaily, apps: feedApps, reported_subscribers: feedSubs },
    web,
  };
}
