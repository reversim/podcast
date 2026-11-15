# Open tasks, decisions and ideas

Claude keeps this list. Claude shows the open items at the end of each work session until the list is empty.
Last update: 2026-11-14.

## Decisions for Ran

| # | Item | Status |
|---|------|--------|
| – | No open decisions. | |

## Tasks for Claude (after the decisions)

| # | Item | Depends on |
|---|------|------------|
## Reminders with dates

- The API token `reversim-setup` in `.env` expires on 2026-11-14 at 21:59:59 UTC. After that, remove the line `CLOUDFLARE_API_TOKEN` from `.env`. A new WAF change needs a new token.
- 2026-11-15: check that the first automatic weekly stats email arrived.
- 2026-11-19 or later: one-week CPU check of the analytics Worker.

## Ideas (not started)

- Chapter images in the Podcasting 2.0 chapters file.
- A page for each guest and each company (now there is one index page for each).

## Done

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
