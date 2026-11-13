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

## First deploy

1. `npx wrangler d1 create reversim-archive`, then put the id in `wrangler.toml`.
2. Enable the `routes` line in `wrangler.toml` (`mcp.reversim.com`).
3. `npm run seed:remote && npm run deploy`.
4. Add a Cloudflare rate-limit rule for `mcp.reversim.com`. The free plan limit of 100,000 Worker requests each day is for the full account, and the audio Worker uses the same limit.

After each new episode: `node scripts/mcp-export.mjs && (cd mcp && npm run seed:remote)`. The seed drops and fills all tables.

## Use it

Claude Code: `claude mcp add --transport http reversim https://mcp.reversim.com/mcp`
