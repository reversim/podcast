# Reversim MCP server

A public, read-only [MCP](https://modelcontextprotocol.io) server over the episode archive: show notes, guests, topics and transcripts.
It lets an AI assistant search what was said in the podcast and link to the exact minute.

- Runtime: one Cloudflare Worker and one D1 database (SQLite full-text search with trigram tokens). Both fit the free plan.
- Endpoint: `POST /mcp` (Streamable HTTP, JSON responses, no sessions, no login).
- Tools: `search_episodes`, `search_transcripts`, `get_episode`, `get_transcript`, `list_recent_episodes`.

## Local test

```bash
node scripts/mcp-export.mjs        # from the repo root: writes mcp/seed.sql
cd mcp && npm install
npm run seed:local
npm run dev -- --port 8799
curl -s -X POST localhost:8799/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_transcripts","arguments":{"query":"Vendor Lock-in"}}}'
```

## Deploy

Live at `https://mcp.reversim.com/mcp` since 2026-11-14 (D1 database `reversim-archive`). Deploy a code change with `npm run deploy`.

The free plan limit of 100,000 Worker requests each day is for the full account, and the audio Worker uses the same limit. Keep a Cloudflare rate-limit rule on `mcp.reversim.com`.

After each new episode: `node scripts/mcp-export.mjs && (cd mcp && npm run seed:remote)`. The seed drops and fills all tables.

## Use it

Claude Code: `claude mcp add --transport http reversim https://mcp.reversim.com/mcp`

## Access count

Each `initialize` request and each tool call adds to table `mcp_hits` in the analytics database (`reversim-analytics`, binding `STATS`).
The hourly cron of the analytics Worker builds `mcp_daily`, and stats.reversim.com shows it in the section "AI assistants (MCP)".
A client is a salted hash of the IP address and the user agent. The salt is the secret `HASH_SALT` of this Worker. Without the secret, the Worker counts nothing.

## Rate limit

A Cloudflare rate limiting rule on the zone blocks an IP address for 10 seconds after 50 requests in 10 seconds to `mcp.reversim.com`.
The rule is in the dashboard (Security, WAF, Rate limiting rules). A limit in the Worker code is not reliable, because each Worker instance counts separately.
