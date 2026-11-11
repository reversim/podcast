// Hourly rollup. Idempotent: for each affected day, delete then insert-select.
import { addDays, utcDay } from './lib';
import type { Env } from './env';

const VALID = `ua_type != 'bot' AND bytes >= min(size, ?2)`;
const RETENTION_DAYS = 100;

/**
 * heavy=false: only per-day tables for today and yesterday (cheap).
 * heavy=true: also monthly + audience tables, which scan up to 90 days of hits
 * (run every 6 hours from cron to stay inside the D1 free read quota).
 */
export async function rollup(env: Env, opts: { now?: number; heavy?: boolean; backfillDays?: number } = {}): Promise<void> {
  const now = opts.now ?? Date.now();
  const today = utcDay(now);
  const minBytes = Number(env.MIN_BYTES) || 750000;
  const db = env.DB;
  const days = [addDays(today, -1), today];
  for (let i = 2; i <= (opts.backfillDays ?? 0); i++) days.unshift(addDays(today, -i));
  const stmts: D1PreparedStatement[] = [];
  const q = (sql: string, ...args: unknown[]) => stmts.push(db.prepare(sql).bind(...args));

  for (const d of days) {
    for (const t of ['ep_daily', 'dim_daily', 'totals_daily', 'feed_daily']) q(`DELETE FROM ${t} WHERE day = ?1`, d);
    q(`INSERT INTO ep_daily SELECT day, file, count(*), count(DISTINCT listener) FROM hits
       WHERE day = ?1 AND ${VALID} GROUP BY file`, d, minBytes);
    for (const [dim, col, nul] of [['app', 'app', 'Unknown'], ['country', 'country', 'XX'], ['device', 'device', 'unknown']]) {
      q(`INSERT INTO dim_daily SELECT day, '${dim}', coalesce(${col}, '${nul}'), count(*) FROM hits
         WHERE day = ?1 AND ${VALID} GROUP BY 3`, d, minBytes);
    }
    q(`INSERT INTO totals_daily SELECT ?1,
         coalesce(sum(${VALID}), 0),
         count(DISTINCT CASE WHEN ${VALID} THEN listener END),
         coalesce(sum(reqs), 0),
         coalesce(sum(CASE WHEN ua_type = 'bot' THEN reqs END), 0),
         coalesce(sum(ua_type != 'bot' AND NOT (${VALID})), 0)
       FROM hits WHERE day = ?1`, d, minBytes);
    q(`INSERT INTO feed_daily SELECT day, coalesce(app, 'Unknown'), count(*), sum(reqs), coalesce(sum(subs), 0)
       FROM feed_hits WHERE day = ?1 GROUP BY 2`, d);
  }

  if (opts.heavy !== false) {
    const month = today.slice(0, 7);
    const prevMonth = utcDay(Date.parse(month + '-01T00:00:00Z') - 86400000).slice(0, 7);
    for (const m of [prevMonth, month]) {
      const next = utcDay(Date.parse(m + '-01T00:00:00Z') + 32 * 86400000).slice(0, 7) + '-01';
      q(`DELETE FROM totals_monthly WHERE month = ?1`, m);
      q(`INSERT INTO totals_monthly SELECT ?1,
           (SELECT coalesce(sum(downloads), 0) FROM totals_daily WHERE day >= ?1 || '-01' AND day < ?3),
           (SELECT count(DISTINCT listener) FROM hits WHERE day >= ?1 || '-01' AND day < ?3 AND ${VALID})`,
        m, minBytes, next);
    }
    for (const d of [addDays(today, -1), today]) {
      q(`DELETE FROM audience_daily WHERE day = ?1`, d);
      q(`INSERT INTO audience_daily SELECT ?1,
           (SELECT count(DISTINCT listener) FROM hits
             WHERE day > date(?1, '-30 day') AND day <= ?1 AND ${VALID}),
           (SELECT count(DISTINCT listener) FROM hits
             WHERE day >= date(?1, '-90 day') AND day <= date(?1, '-30 day') AND ${VALID}
               AND listener NOT IN (SELECT listener FROM hits
                 WHERE day > date(?1, '-30 day') AND day <= ?1 AND ${VALID}))`,
        d, minBytes);
    }
  }

  const cutoff = addDays(today, -RETENTION_DAYS);
  q(`DELETE FROM hits WHERE day < ?1`, cutoff);
  q(`DELETE FROM feed_hits WHERE day < ?1`, cutoff);
  await db.batch(stmts);
}
