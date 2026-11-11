# Reversim podcast analytics worker

Private, IAB-style download analytics on Cloudflare Workers (free plan) and D1.
One Worker serves three hosts:

- Media (`MEDIA_HOSTS`): logs MP3 downloads. It never blocks audio.
- Feed (`FEED_HOSTS`): proxies the RSS feed (10 minute cache) and counts fetchers.
- Beacon (`POST /_e` on the media hosts): cookieless page views, see below.
- Stats (`STATS_HOST`): dashboard (`../dashboard`) and `GET /api/stats?days=N`, behind auth.

A download is one `(day, file, listener)` key that is not a bot and has
`bytes >= min(file size, MIN_BYTES)`. Range probes of 2 bytes or less are ignored.
Listener = first 32 hex chars of SHA-256(`HASH_SALT|ip|user-agent`), IPv6 cut to /64.
No raw IP or full user agent is stored. Raw rows are pruned after 100 days.
User agents are classified with the OPAWG list in `vendor/` (MIT, see `vendor/LICENSE`).

## Deploy

Run all commands in this directory. Check that `npx wrangler whoami` shows account
`bddcd14d3bb33ee6bdb8cfff3cab9b37` first.

1. `npm install`
2. `npx wrangler d1 create reversim-analytics`, then put the `database_id` in `wrangler.toml`.
3. `npx wrangler d1 execute reversim-analytics --remote --file=schema.sql`
4. `openssl rand -hex 32 | npx wrangler secret put HASH_SALT`. Never change it later: it resets all listener ids.
5. Auth for the stats host, one of:
   - Cloudflare Access (preferred): create an Access app for the stats host, then set
     `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `[vars]`.
   - Token: `npx wrangler secret put DASH_TOKEN`. Use it as the Basic auth password.
   - With neither, the stats host answers 503.
6. `npx wrangler deploy`. No traffic arrives until you enable routes.
7. Canary: uncomment one route in `wrangler.toml` (start with `m2.reversim.com/*`), deploy, test, then the next.
   Keep the R2 custom domains attached: `ORIGIN_MODE="passthrough"` fetches audio from them.
   Set `ORIGIN_MODE="r2"` to serve from the bucket in the Worker instead.
   For the stats host, use a Workers custom domain (`custom_domain = true` route).
8. The Redirect Rule for `feed.reversim.com` must stay disabled: rules run before Workers.
   With `FEED_MODE="redirect"` the Worker counts the fetch and answers 302 to `FEED_ORIGIN`.
   `FEED_MODE="proxy"` returns the feed body, but fails while the zone SSL mode is Flexible.

Live setup: dashboard at https://stats.reversim.com behind Cloudflare Access.
Rollback for audio: remove the `m.` and `m2.` routes from `wrangler.toml`, then `npx wrangler deploy`.

## Local development

```
cp .dev.vars.example .dev.vars          # DEV=1 enables the x-dev-host header
npx wrangler d1 execute DB --local --file=schema.sql
npx wrangler dev --local --var ORIGIN_MODE:r2
curl -H 'x-dev-host: m2.reversim.com' -A 'Spotify/8.7.10 iOS/15.3.1' localhost:8787/file.mp3
curl -u x:local-dev-token -X POST -H 'x-dev-host: stats.reversim.com' localhost:8787/api/rollup
```

`npm test` runs unit tests. `npm run typecheck` runs tsc.

## Website page views (beacon)

The site script (`src/layouts/BaseLayout.astro`) sends `navigator.sendBeacon` to `https://m2.reversim.com/_e`
on page load (`pv`) and on the first audio play or `.mp3` link click (`play`). No cookies, no storage.
The stats host is behind Access, so the endpoint lives on the media hosts only.

- The Worker answers 204 at once and writes in `waitUntil`. It stores nothing when the `Origin` (or `Referer`)
  is not in `SITE_ORIGINS`, the body is over 1024 bytes or invalid, the path or referrer fails its pattern, or the UA is a bot.
  `DEV=1` also allows `http://localhost:*`.
- `page_hits (day, path, visitor)` takes one upsert per beacon (1 D1 row written). Pruned after 100 days.
- The hourly rollup builds `web_daily`, `pages_daily`, `ref_daily` in a separate batch, so a DB without them cannot break the download rollup.
- `/api/stats` adds `web: { daily, pages, referrers }`. `pages.visitors` and `referrers.visitors` are sums of daily uniques.
  A visitor has one referrer per day: the real host if any page view that day had one.
- Deploy order: apply `schema.sql` to the remote DB first, then deploy the Worker, then publish the site.
- Local test: POST with `-H 'x-dev-host: m2.reversim.com' -H 'Origin: https://www.reversim.com' -d '{"t":"pv","p":"/x.html","r":"google.com"}'`,
  then `POST /api/rollup`. To use the token locally, start dev with `--var ACCESS_TEAM_DOMAIN: --var ACCESS_AUD:`.

## Apple and Spotify numbers (hand-imported)

Apple Podcasts Connect and Spotify for Creators have no analytics API. The dashboard section "Apple and Spotify"
stores numbers you type or import from a CSV export in `platform_stats (platform, metric, day, value)`.

- `POST /api/platform` with `{"rows":[{"day":"YYYY-MM-DD","platform":"spotify","metric":"followers","value":1234}]}`
  upserts up to 5000 rows (512 KB). Any invalid row gives 400 `{"error":"...","row":N}` and nothing is written.
  `DELETE /api/platform?platform=..&metric=..[&day=..]` removes a series or one point.
- Both need `Origin` equal to `https://<STATS_HOST>` (with `DEV=1`, the `x-dev-host` host), else 403. POST needs `Content-Type: application/json`.
- `GET /api/stats` adds `platforms: { series, latest }`. If the table is missing, both are empty arrays.
- Deploy order: apply `schema.sql` to the remote DB first, then deploy the Worker.
- The CSV parser and column detection live in `dashboard/index.html` between `csv:start` and `csv:end`; `test/csv.test.ts` evaluates that block.
  The sample files in `test/fixtures/` are synthetic. The real Spotify and Apple export layouts are not verified.
- `?mock=1` on the dashboard keeps these numbers in memory only.

## YouTube (automatic, daily)

`src/youtube.ts` reads the YouTube Data API v3 once per UTC day. It does nothing, and logs nothing, until both values exist:

- `YOUTUBE_CHANNEL_ID` in `[vars]` (now the @Reversim-summit channel; change it there if the podcast uses another channel).
- Secret `YOUTUBE_API_KEY`: `npx wrangler secret put YOUTUBE_API_KEY` (a Google Cloud API key with only "YouTube Data API v3" enabled).

- The hourly cron runs the fetch from 03:00 UTC on, once per day (marker `meta.youtube_day`). After a failure it retries the next hour. It has its own `waitUntil`, so it cannot affect the rollup. A YouTube error logs one line, never the key.
- Stored in `platform_stats` as `('youtube', followers|views|videos, day)`, so the "Followers, all platforms" tile includes it. YouTube rounds subscribers to 3 significant figures. Hidden subscriber counts are skipped.
- Per video: `yt_videos` (title, date) and `yt_video_daily (day, video_id, views, likes, comments)`. A daily row is written only when the view count changed. Nothing is pruned.
- Cost for a 500-video channel: 21 quota units per run (limit 10000 per day), 21 fetch subrequests, at most 3 + 500 + 500 D1 rows on the first day and then one row per video whose views changed. Cap: the newest 1000 videos (41 fetches).
- `POST /api/youtube/refresh` (same Origin rule as `/api/platform`) runs it now and returns `{ok, channel, videos_seen, rows_written}` or `{ok:false, error}`.
- `GET /api/stats` adds `youtube: {channel_id, configured, last_day, videos[{id,title,published,views,views_in_range}]}` (top 200).
- Deploy order: apply `schema.sql` to the remote DB first, then deploy the Worker, then set the secret.

## Notes

- Cron runs hourly (minute 7). Per-day tables rebuild every hour. Monthly and audience
  tables rebuild every 6 hours: they scan up to 90 days of `hits`, so this saves D1 reads.
  `POST /api/rollup` rebuilds everything now.
- `bytes` is the size the response declared, not what the client received. An aborted download still counts.
- Free plan limit is 10 ms CPU per request. The first classification in a fresh isolate compiles regexes lazily (about 10 ms worst case in Node).
