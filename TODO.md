# Open tasks, decisions and ideas

Claude keeps this list. Claude shows the open items at the end of each work session until the list is empty.
Last update: 2026-11-18.

## Decisions for Ran

| # | Item | Status |
|---|------|--------|
| D8 | More audio options that Claude proposed (2026-11-24): (a) repair of clipped peaks (`adeclip`) before the patch; (b) a light expander on each track against microphone bleed; (c) a livelier filter for guests (`default.patch`). Claude makes samples for each on request. | Waiting for Ran. |

## Tasks for Claude (after the decisions)

| # | Item | Depends on |
|---|------|------------|
## Reminders with dates

- YouTube playlist `PLPrpPQF5fJrM` (checked 2026-11-18): 72 of 824 episodes are uploaded (523 down to 450), all public. The RSS import continues. Check later that new uploads are public too.
- Amazon Music numbers: the first values are 0 (listed 2026-11-15). When real numbers come, check that `followers` is the full count and that the cookies still work (lifetime not known).
- 2026-11-19 or later: one-week CPU check of the analytics Worker.

## Audit findings (2026-11-15), not started

Directories:
- Deezer: listed 2026-11-15 (`https://www.deezer.com/show/1003759371`). Amazon Music: listed 2026-11-15 (`https://music.amazon.com/podcasts/c8ba795c-011b-4aba-9438-c838216078c5`).
- General directories: Ran said "that's enough" on 2026-11-16 (no TuneIn, fyyd, gpodder, Podchaser, Listen Notes). YouTube: playlist `https://www.youtube.com/playlist?list=PLPrpPQF5fJrM` in the channel `@reversim-podcast` (chosen 2026-11-17). The first playlist `PLGEjVtVqTmNs` in the Summit channel (64 videos) is not used; Ran can delete it.
- Israeli directories (checked 2026-11-16). Listed: podcastim.org.il, israeltips.net, webmaster.org.il (links to `http://www.reversim.com/`), pod-il.co.il. Not listed: פודקאסט.ישראל (the site with the Hebrew domain), `lirantal/awesome-opensource-israel` on GitHub (section Podcasts), the Geektime article of company podcasts. Ran decides which to request.
- Podcast Republic is stale (stops at episode 513).

Reach:
- Email newsletter for each episode.
- LinkedIn page for the podcast.
- Hebrew Wikipedia article and Wikidata item.

## Ideas (not started)

- Chapter images in the Podcasting 2.0 chapters file.
- A page for each guest and each company (now there is one index page for each).

## Done

- Reach items from the audit (2026-11-18): large share image for each episode (`/share/<post id>.jpg`, 1200 x 630, `summary_large_image`); topic pages (`/topics/<topic>.html`, 14 topics from the catalog, in the sitemap); share buttons on the episode page (X, LinkedIn, Facebook, WhatsApp, copy link with the `#t=` position); guide for guests (`/share-guide.html`). `make produce` now runs `scripts/catalog.mjs`, so a new episode gets its guest and topic links.
- Voice filter (2026-11-24): Ran selected option E ("Radio, vivid") for his voice from six samples; Ori keeps the patch. The settings are in `assets/patches/voices.json` (low cut 80 Hz, bass, presence, air, exciter, light compressor after the patch). Applies from episode 524.
- MP3 format (2026-11-18): new episodes are 128 kbps constant bit rate, with ID3 tags (Hebrew title, show name, episode number, year) and the episode cover in the file (`COVER_IMAGE`; the show cover when there is none). Old episodes are not changed.
- Episode 523 published (2026-11-18): cold open with two quotes of the guest (offset 20.4 s), OpenSearch logo, MP3 on R2 and S3. Cold open fault corrected in the script: the model answer in a list was dropped, and fast speech gave too few pauses for a clean cut. Note: `CLOUDFLARE_API_TOKEN` is locked to an IP address, so Claude cannot purge the CDN cache; a replaced MP3 can stay cached for up to 4 hours. For 523 the MP3 has a new name for this reason (`…_v2.mp3`). When an MP3 is replaced, give it a new name. `make mcp-update` must run without `CLOUDFLARE_API_TOKEN` in the environment (`env -u CLOUDFLARE_API_TOKEN make mcp-update`).
- Production routine (2026-11-18): Hebrew blog title (`523: <Hebrew title>`; an English `TITLE` is translated, the slug stays English), Word notes (`NOTES=file.docx`), speaker balance (each speaker gets the same level, measured while that speaker talks), true-peak limiter (final peak below -1 dBFS).
- Sound quality (2026-11-17): the production script used the raw GarageBand tracks with no track effects and an aggressive normalizer. Now `scripts/post-production.mjs` reads the GarageBand patches in `assets/patches/` (`Ran.patch`, `Ori.patch`, `default.patch` for guests; EQ and compressors) and applies them to each track, then sets the speech to -16 LUFS with a fixed gain. To change a sound: save the patch in GarageBand and replace the file. Not reproduced: reverb sends, exact de-esser values. Episode 522 was made again and replaced on R2 and S3 (same timeline, no welcome line, no cold open). The old file is at `~/Downloads/reversim522-published-before-2026-11-17.mp3`. No raw tracks exist for episodes before 522.
- YouTube numbers (2026-11-17): the analytics Worker reads the playlist each day with the YouTube Data API (`analytics/worker/src/youtube.ts`, secret `YOUTUBE_API_KEY`). It stores `views_total`, `videos_public` and `videos_private` for platform `youtube`. Note: `wrangler` fails when `CLOUDFLARE_API_TOKEN` from `.env` is in the environment (IP limit); use `env -u CLOUDFLARE_API_TOKEN npx wrangler ...`.
- YouTube link (2026-11-16): the playlist is in `SHOW_LINKS.youtube`, the footer and `sameAs`.
- List page descriptions (2026-11-16): year, month and "page N" pages get a description with the count and the first titles (`listDescription` in `src/lib/episode.ts`); about, archive and episodes have their own text. No built page has the generic description.
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

- The other items of the 2026-11-15 distribution audit (Ran, 2026-11-18: "stop, that's enough"): the Israeli directory requests, Podcast Republic, email newsletter, LinkedIn page, Wikipedia and Wikidata.

- Noise reduction and patch reverb in the audio chain (2026-11-18, Ran let Claude decide; decision: add neither). Measurements: the quietest moments of 523 are 41 to 51 dB below the speech level, the same as the GarageBand export of 522, so a noise filter gives no audible gain and can add artifacts. The decay after speech in the GarageBand export of 522 and in our mix is equal within 0.5 dB at 50 to 300 ms, so the reverb sends of the patches add no measurable reverb. Examine again only if a recording has audible hiss or hum.

- Social clips (2026-11-14: "don't like it, get rid of it"). The script is deleted.

- Transcript backfill for old episodes (2026-11-13: "Do not backfill transcripts").
- WhatsApp channel, YouTube RSS ingestion, Geektime vote, promo swaps (2026-11-13: "not now").
