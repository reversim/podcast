// Read-only MCP server (Streamable HTTP, stateless JSON responses) over the Reversim episode archive.
// Endpoint: POST /mcp with JSON-RPC 2.0. No login: all data is already public on www.reversim.com.
export interface Env {
	ARCHIVE: D1Database;
	SITE: string;
	STATS?: D1Database; // the analytics database (stats.reversim.com), for the access count
	HASH_SALT?: string; // secret; without it the access count is off
}

const PROTOCOL = '2025-06-18';
const SERVER = { name: 'reversim-podcast', title: 'רברס עם פלטפורמה — ארכיון הפרקים', version: '1.0.0' };
const MAX_BODY = 64 * 1024;

const TOOLS = [
	{
		name: 'search_episodes',
		description:
			'Search the episodes of the Hebrew tech podcast "רברס עם פלטפורמה" (Reversim, since 2009) by title, guest, company and show notes. Query in Hebrew or English. Returns episode ids, titles, dates, guests and a one-line summary.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Words to find, for example "Kafka", "ניהול צוות", a guest name or a company name.' },
				limit: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
			},
			required: ['query'],
		},
	},
	{
		name: 'search_transcripts',
		description:
			'Search inside what was said in the episodes (full transcripts, Hebrew with English technical terms). Returns passages of about one minute with the episode, the time, and a link that plays from that time. Not all old episodes have a transcript.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Words that were said, for example "Vendor Lock-in" or "מוח ארגוני".' },
				episode: { type: 'string', description: 'Optional: an episode id or number, to search in one episode only.' },
				limit: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
			},
			required: ['query'],
		},
	},
	{
		name: 'get_episode',
		description: 'Get one episode: title, date, guests, companies, topics, links and the full show notes. Use an episode id from a search, or the episode number.',
		inputSchema: { type: 'object', properties: { episode: { type: 'string', description: 'Episode id or number, for example "522".' } }, required: ['episode'] },
	},
	{
		name: 'get_transcript',
		description: 'Get the transcript of one episode, or a part of it by time. A full transcript is long (about 10,000 words for an hour); ask for a time range when you can.',
		inputSchema: {
			type: 'object',
			properties: {
				episode: { type: 'string', description: 'Episode id or number.' },
				from_seconds: { type: 'integer', minimum: 0, default: 0 },
				to_seconds: { type: 'integer', minimum: 0, description: 'Default: 15 minutes after from_seconds.' },
			},
			required: ['episode'],
		},
	},
	{
		name: 'list_recent_episodes',
		description: 'List the newest episodes, newest first.',
		inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 } } },
	},
];

type Args = Record<string, unknown>;
class ToolError extends Error {}

const clampInt = (v: unknown, def: number, min: number, max: number) => {
	const n = Math.floor(Number(v));
	return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const stamp = (s: number) => {
	const pad = (n: number) => String(n).padStart(2, '0');
	const h = Math.floor(s / 3600);
	return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

/** Builds an FTS5 MATCH expression. Trigram search needs terms of 3 or more characters; shorter terms are dropped. */
export function ftsQuery(query: string): string | null {
	const terms = query
		.slice(0, 200)
		.split(/\s+/)
		.map((t) => t.replace(/["*^(){}:]/g, '').trim())
		.filter((t) => [...t].length >= 3)
		.slice(0, 8);
	return terms.length ? terms.map((t) => `"${t}"`).join(' AND ') : null;
}

async function findEpisode(env: Env, ref: unknown) {
	const key = String(ref ?? '').trim();
	if (!key) throw new ToolError('Give an episode id or number.');
	const row = /^\d{1,4}$/.test(key)
		? await env.ARCHIVE.prepare('SELECT * FROM episodes WHERE number = ?1 ORDER BY date DESC LIMIT 1').bind(Number(key)).first<Record<string, unknown>>()
		: await env.ARCHIVE.prepare('SELECT * FROM episodes WHERE id = ?1').bind(key.toLowerCase()).first<Record<string, unknown>>();
	if (!row) throw new ToolError(`No episode found for "${key.slice(0, 80)}". Use search_episodes to find the id.`);
	return row;
}

const brief = (r: Record<string, unknown>) => ({
	id: r.id, number: r.number, title: r.title, date: r.date, url: r.url,
	guests: r.guests || undefined, companies: r.companies || undefined, summary: r.hook || undefined,
	has_transcript: r.has_transcript === 1,
});

async function callTool(env: Env, name: string, args: Args): Promise<unknown> {
	switch (name) {
		case 'search_episodes': {
			const match = ftsQuery(String(args.query ?? ''));
			if (!match) throw new ToolError('The query needs a word of 3 or more characters.');
			const limit = clampInt(args.limit, 10, 1, 25);
			const { results } = await env.ARCHIVE.prepare(
				`SELECT e.* FROM episodes_fts f JOIN episodes e ON e.id = f.id
				 WHERE episodes_fts MATCH ?1 ORDER BY bm25(episodes_fts, 0, 8, 6, 6, 3, 1) LIMIT ?2`,
			).bind(match, limit).all<Record<string, unknown>>();
			return { count: results.length, episodes: results.map(brief) };
		}
		case 'search_transcripts': {
			const match = ftsQuery(String(args.query ?? ''));
			if (!match) throw new ToolError('The query needs a word of 3 or more characters.');
			const limit = clampInt(args.limit, 8, 1, 20);
			const only = args.episode ? ((await findEpisode(env, args.episode)).id as string) : null;
			const { results } = await env.ARCHIVE.prepare(
				`SELECT p.episode_id, p.start, p.text, e.title, e.number, e.date, e.url
				 FROM passages_fts f JOIN passages p ON p.rowid = f.rowid JOIN episodes e ON e.id = p.episode_id
				 WHERE passages_fts MATCH ?1 AND (?2 IS NULL OR p.episode_id = ?2)
				 ORDER BY bm25(passages_fts) LIMIT ?3`,
			).bind(match, only, limit).all<Record<string, unknown>>();
			return {
				count: results.length,
				passages: results.map((r) => ({
					episode_id: r.episode_id, number: r.number, title: r.title, date: r.date,
					time: stamp(r.start as number), link: `${r.url}#t=${r.start}`, text: r.text,
				})),
			};
		}
		case 'get_episode': {
			const r = await findEpisode(env, args.episode);
			return { ...brief(r), kind: r.kind, topics: r.topics || undefined, audio_url: r.audio_url, duration_seconds: r.seconds, show_notes: r.notes };
		}
		case 'get_transcript': {
			const r = await findEpisode(env, args.episode);
			if (r.has_transcript !== 1) throw new ToolError(`Episode "${r.title}" has no transcript yet. Use get_episode for the show notes.`);
			const from = clampInt(args.from_seconds, 0, 0, 86400);
			const to = clampInt(args.to_seconds, from + 900, from + 1, 86400);
			const { results } = await env.ARCHIVE.prepare(
				'SELECT start, text FROM passages WHERE episode_id = ?1 AND start >= ?2 AND start < ?3 ORDER BY start LIMIT 200',
			).bind(r.id, Math.max(0, from - 60), to).all<{ start: number; text: string }>();
			return {
				episode_id: r.id, title: r.title, url: r.url, from: stamp(from), to: stamp(to), duration_seconds: r.seconds,
				note: 'The transcript is automatic and can have errors.',
				transcript: results.map((p) => `[${stamp(p.start)}]\n${p.text}`).join('\n\n'),
			};
		}
		case 'list_recent_episodes': {
			const { results } = await env.ARCHIVE.prepare('SELECT * FROM episodes ORDER BY date DESC LIMIT ?1').bind(clampInt(args.limit, 10, 1, 50)).all<Record<string, unknown>>();
			return { episodes: results.map(brief) };
		}
		default:
			throw new ToolError(`Unknown tool: ${name.slice(0, 60)}`);
	}
}

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const fail = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function handleRpc(env: Env, msg: Rpc): Promise<unknown | null> {
	if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return fail(msg?.id, -32600, 'Invalid Request');
	const isNotification = msg.id === undefined;
	switch (msg.method) {
		case 'initialize':
			return ok(msg.id, {
				protocolVersion: PROTOCOL,
				capabilities: { tools: {} },
				serverInfo: SERVER,
				instructions: 'Archive of the Hebrew software engineering podcast "רברס עם פלטפורמה" (Reversim). Search episodes or transcripts, then cite the episode title and link. Transcripts are automatic and can have errors.',
			});
		case 'ping':
			return ok(msg.id, {});
		case 'tools/list':
			return ok(msg.id, { tools: TOOLS });
		case 'tools/call': {
			const name = String(msg.params?.name ?? '');
			const args = (msg.params?.arguments ?? {}) as Args;
			try {
				const data = await callTool(env, name, args);
				return ok(msg.id, { content: [{ type: 'text', text: JSON.stringify(data, null, 1) }] });
			} catch (e) {
				// Tool problems go back as a tool result, so the model can read them and try again.
				const text = e instanceof ToolError ? e.message : 'The archive search failed. Try again later.';
				if (!(e instanceof ToolError)) console.error('tool error', name, e);
				return ok(msg.id, { content: [{ type: 'text', text }], isError: true });
			}
		}
		default:
			return isNotification ? null : fail(msg.id, -32601, `Method not found: ${msg.method.slice(0, 60)}`);
	}
}

// ── Access count for stats.reversim.com ──────────────────────────────────────

/** What to count for a request body: "connect" for each initialize, the tool name for each tool call. */
export function statKeys(body: unknown): string[] {
	const keys: string[] = [];
	for (const m of (Array.isArray(body) ? body : [body]) as Rpc[]) {
		if (!m || typeof m.method !== 'string') continue;
		if (m.method === 'initialize') keys.push('connect');
		else if (m.method === 'tools/call') {
			const name = String(m.params?.name ?? '');
			keys.push(TOOLS.some((t) => t.name === name) ? name : 'unknown tool');
		}
	}
	return keys;
}

/** Short client name from the User-Agent: the product before the first "/" or "(". */
export function clientApp(ua: string | null): string {
	const m = /^[\w .-]{1,40}/.exec((ua ?? '').trim());
	const name = m ? m[0].trim() : '';
	if (!name) return 'Unknown';
	return name === 'Mozilla' ? 'Browser' : name;
}

async function logHits(request: Request, env: Env, keys: string[]): Promise<void> {
	try {
		if (!env.STATS || !env.HASH_SALT || keys.length === 0) return;
		const ua = request.headers.get('user-agent');
		const ip = request.headers.get('cf-connecting-ip') ?? '';
		// IPv6: keep the /64 prefix, so one device with changing addresses is one client.
		const net = ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip;
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.HASH_SALT}|${net}|${ua ?? ''}`));
		const client = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
		const day = new Date().toISOString().slice(0, 10);
		const stmt = env.STATS.prepare(
			`INSERT INTO mcp_hits (day, client, method, app, reqs) VALUES (?1, ?2, ?3, ?4, 1)
			 ON CONFLICT (day, client, method) DO UPDATE SET reqs = reqs + 1`,
		);
		const app = clientApp(ua);
		await env.STATS.batch(keys.map((k) => stmt.bind(day, client, k, app)));
	} catch (e) {
		console.error('access count failed', e);
	}
}

const CORS = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'POST, GET, OPTIONS',
	'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization, poppy-session',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });

/** The MCP server card: what a client needs to know before it connects. */
export function serverCard(origin: string, site: string) {
	return {
		$schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
		name: 'com.reversim/podcast',
		title: 'Reversim Podcast archive (רברס עם פלטפורמה)',
		version: SERVER.version,
		description: 'Search the episodes and transcripts of the Hebrew software engineering podcast Reversim (since 2009). Read-only, free, no login.',
		websiteUrl: `${site.replace(/\/$/, '')}/mcp.html`,
		serverInfo: SERVER,
		protocolVersion: PROTOCOL,
		transport: { type: 'streamable-http', endpoint: `${origin}/mcp` },
		remotes: [{ type: 'streamable-http', url: `${origin}/mcp` }],
		authentication: { required: false, schemes: [] },
		capabilities: { tools: {} },
		tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
		if (url.pathname === '/' && request.method === 'GET') {
			return new Response(
				`Reversim podcast MCP server.\nEndpoint: ${url.origin}/mcp (Streamable HTTP).\nTools: ${TOOLS.map((t) => t.name).join(', ')}.\nSite: ${env.SITE}\n`,
				{ headers: { 'content-type': 'text/plain; charset=utf-8', ...CORS } },
			);
		}
		// Discovery document for MCP clients. The path is not yet a final standard, so the two common paths get the same card.
		if (request.method === 'GET' && (url.pathname === '/.well-known/mcp/server-card.json' || url.pathname === '/.well-known/mcp.json')) {
			return json(serverCard(url.origin, env.SITE));
		}
		if (url.pathname !== '/mcp') return json({ error: 'not found' }, 404);
		// This server has no server-to-client stream and no sessions.
		if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST, OPTIONS', ...CORS } });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return json(fail(null, -32600, 'Request too large'), 413);
		let body: unknown;
		try {
			const text = await request.text();
			if (text.length > MAX_BODY) return json(fail(null, -32600, 'Request too large'), 413);
			body = JSON.parse(text);
		} catch {
			return json(fail(null, -32700, 'Parse error'), 400);
		}
		ctx.waitUntil(logHits(request, env, statKeys(body).slice(0, 20)));
		if (Array.isArray(body)) {
			if (body.length === 0 || body.length > 20) return json(fail(null, -32600, 'Invalid batch'), 400);
			const replies = (await Promise.all(body.map((m) => handleRpc(env, m as Rpc)))).filter((r) => r !== null);
			return replies.length ? json(replies) : new Response(null, { status: 202, headers: CORS });
		}
		const reply = await handleRpc(env, body as Rpc);
		return reply === null ? new Response(null, { status: 202, headers: CORS }) : json(reply);
	},
};
