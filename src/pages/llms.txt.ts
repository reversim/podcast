// /llms.txt — the entry point for AI agents (https://llmstxt.org).
import { llmsTxt } from '../lib/agents';
import { agentEpisodes, SITE } from '../lib/agentEpisodes';

export async function GET() {
	return new Response(llmsTxt(SITE, await agentEpisodes()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
