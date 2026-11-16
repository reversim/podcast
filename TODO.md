# Open tasks, decisions and ideas

Claude keeps this list. Claude shows the open items at the end of each work session until the list is empty.
Last update: 2026-11-15.

## Decisions for Ran

| # | Item | Status |
|---|------|--------|
| D3 | Which items from the 2026-11-15 distribution audit to do (see "Audit findings"). | Waiting for Ran. |

## Tasks for Claude (after the decisions)

| # | Item | Depends on |
|---|------|------------|
## Reminders with dates

- YouTube: the podcast playlist is `https://www.youtube.com/playlist?list=PLGEjVtVqTmNs` (in the Summit channel). It had 0 episodes on 2026-11-16. When it has episodes: add the link to the site (`src/lib/links.ts`, footer, `sameAs`) and remove "YouTube Music" from the not-listed directories.
- Amazon Music numbers: the first values are 0 (listed 2026-11-15). When real numbers come, check that `followers` is the full count and that the cookies still work (lifetime not known).
- 2026-11-19 or later: one-week CPU check of the analytics Worker.

## Audit findings (2026-11-15), not started

Site defects:
- 718 list pages (year, month, page N, about, episodes, archive) have the same generic description.

Directories:
- Deezer: listed 2026-11-15 (`https://www.deezer.com/show/1003759371`). Amazon Music: listed 2026-11-15 (`https://music.amazon.com/podcasts/c8ba795c-011b-4aba-9438-c838216078c5`).
- Not listed: YouTube Music, TuneIn, fyyd, gpodder. Probably not listed: Podchaser, Listen Notes.
- Podcast Republic is stale (stops at episode 513).

Reach:
- Email newsletter for each episode.
- LinkedIn page for the podcast.
- Large share image for each episode (`summary_large_image`).
- Topic pages.
- Share buttons on the episode page; guide for guests.
- Hebrew Wikipedia article and Wikidata item.

## Ideas (not started)

- Chapter images in the Podcasting 2.0 chapters file.
- A page for each guest and each company (now there is one index page for each).

## Done

- Deezer fan count (2026-11-16): the analytics Worker stores the public fan count each day as `('deezer', 'followers')` (`analytics/worker/src/deezer.ts`). Deezer has no API for stream counts.
- Amazon Music numbers (2026-11-16): the analytics Worker pulls starts, plays, listeners and followers each day from the internal API of podcasters.amazon.com (`analytics/worker/src/amazon.ts`, secret `AMAZON_COOKIE`, README section "Amazon Music"). The dashboard shows them in the platform section.
- Feed size (2026-11-16): the podcast feed is 3.1 MB (was 12 MB). Show notes in the feed stop at 4,000 characters (the Apple limit) with a link to the full notes; 227 episodes changed. All 824 episodes stay in the feed. `rss.xml` (42 MB) and `atom.xml` (35 MB) are the blog feeds and are not changed.
- Dead external links in old show notes (2026-11-15): 1,331 links now point to a Wayback Machine copy near the episode date, 6 images too. 151 links with no archived copy were removed (the text stays). 376 posts changed. Not changed: 41 twitter.com links (cannot be checked), about 80 links where two clients disagree, 17 links with a failed archive lookup or Libsyn audio.
- Home page load (2026-11-15): cards and the home hero use small WebP copies of the cover images (`/thumbs/<id>.webp`, made at build time), the font stylesheet does not block the first paint, the search script is deferred.
- Episode art (2026-11-15): the build makes a 1400x1400 JPEG for each episode with a local cover image (`/episode-art/<id>.jpg`: hero image on a card, blurred background, episode number, logo watermark). The feed has `itunes:image` on each of these episodes. No manual step: a new episode gets its art from `cover_image` at the next build.
- Deezer link on the site; standard RSS `<image>` tag in the feed (2026-11-15).
- Old episodes accessibility (2026-11-15): a build plugin (`src/lib/rehypeA11y.mjs`) gives each image without alt a generic alt from the post title, gives each iframe a title, and removes links with no content. 76 dead Libsyn player embeds are removed from the posts. Note: after a change to this plugin, delete `node_modules/.astro/data-store.json` before a local build (the content cache does not see plugin changes).
- Feed title is now "רברס עם פלטפורמה (Reversim)" (2026-11-15).
- Bare domain redirect (2026-11-15): the Cloudflare redirect rule "reversim.com to www.reversim.com" now covers all paths and keeps the query string. Before, only `/` had a redirect and other paths returned error 522.
- Feed tags (2026-11-15): `atom:link rel=self`, `podcast:guid`, `podcast:locked`, `podcast:medium`, `itunes:type`, `podcast:person` (hosts and guests), `itunes:episodeType`. Subscribe button colours now pass WCAG AA contrast.
- Agent access (2026-11-15): `/llms.txt`, `/llms-full.txt`, a `.md` copy of each episode, `Content-Signal` in `robots.txt`, `/.well-known/` files (MCP server card at two paths, `tdmrep.json`, `poppy.json`), MCP server card on the Worker, link to `/mcp.html` in the top navigation.
- Broken links corrected (2026-11-15): 491 image references in 457 old posts, 15 old Blogger search links (the site search now reads `?q=`), 9 Summit year links.
- Weekly stats email arrived (2026-11-15). The top number tiles are smaller for mobile.
- Rate limit for `mcp.reversim.com` (2026-11-14): Cloudflare rate limiting rule, 50 requests in 10 seconds for each IP address, block for 10 seconds. Made through the API with the token `reversim-setup`. Tested: 54 of 300 fast requests passed, 246 got HTTP 429.
- Stats page shows MCP access (2026-11-14): section "AI assistants (MCP)" on stats.reversim.com. The MCP Worker writes to table `mcp_hits` in the analytics database.
- Home page: the episode count is removed from the hero text.
- `make produce` now updates the MCP server at the end (`make mcp-update`).
- MCP server live at `https://mcp.reversim.com/mcp` (2026-11-14), with a usage page at `/mcp.html`. After each new episode: `node scripts/mcp-export.mjs && (cd mcp && npm run seed:remote)`.
- Opening preview from the real pipeline: Ran said LGTM (2026-11-14).
- 99 dead audio URLs: Ran decided to leave them (2026-11-14).
- Pushed 2026-11-14: site redesign, feed tags, transcripts 512-522, cold open, welcome line.
- Guest and company lists: Ran checked them (2026-11-14).
- Home page: "לכל הפרקים" without the number.
- Double "ברוכים הבאים": Ran said OK.
- Welcome line: Kore voice chosen 2026-11-14. File `assets/welcome.wav`, copy in Google Drive `reversim/sound/welcome-voice-kore.wav`. The pipeline uses the file; it does not generate the voice again.
- Cold open: shorter (maximum 2 quotes, 20 s) with a sentence check. Ran: "much better" (2026-11-14).

## Declined

- Social clips (2026-11-14: "don't like it, get rid of it"). The script is deleted.

- Transcript backfill for old episodes (2026-11-13: "Do not backfill transcripts").
- WhatsApp channel, YouTube RSS ingestion, Geektime vote, promo swaps (2026-11-13: "not now").
