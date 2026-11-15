// /llms-full.txt — /llms.txt with one line for every episode.
import { llmsTxt } from '../lib/agents';
import { agentEpisodes, SITE } from '../lib/agentEpisodes';

export async function GET() {
	return new Response(llmsTxt(SITE, await agentEpisodes(), true), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
