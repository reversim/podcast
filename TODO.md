# Open tasks, decisions and ideas

Claude keeps this list. Claude shows the open items at the end of each work session until the list is empty.
Last update: 2026-11-15.

## Decisions for Ran

| # | Item | Status |
|---|------|--------|
| D2 | Bare domain defect: `reversim.com/<path>` returns error 522 (only `/` redirects). Needs a Cloudflare redirect rule: Ran makes it in the dashboard, or gives a new API token with "Single Redirect: Edit". | Found 2026-11-15. Blocked: the token expired. |
| D3 | Which items from the 2026-11-15 distribution audit to do (see "Audit findings"). | Waiting for Ran. |

## Tasks for Claude (after the decisions)

| # | Item | Depends on |
|---|------|------------|
## Reminders with dates

- 2026-11-19 or later: one-week CPU check of the analytics Worker.

## Audit findings (2026-11-15), not started

Site defects:
- Old episodes: 417 images without alt text, 378 iframes without a title, about 1,000 links without text. Lighthouse accessibility is 80 on old episodes and 94-96 on new pages.
- Spotify subscribe button: colour contrast is too low (all pages).
- 718 list pages (year, month, page N, about, episodes, archive) have the same generic description.
- Home page: 1.6 MB, largest paint 5.0 s on mobile.

Feed:
- No `atom:link rel=self`, `podcast:guid`, `podcast:locked`, `itunes:type`, `podcast:person`, sub-category, per-episode image.
- The feed is 12 MB.
- The channel title is Hebrew only, so a search for "reversim" fails in Pocket Casts, Player FM, iHeart.

Directories:
- Not listed: YouTube Music, Amazon Music / Audible, Deezer, TuneIn, fyyd, gpodder. Probably not listed: Podchaser, Listen Notes.
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
