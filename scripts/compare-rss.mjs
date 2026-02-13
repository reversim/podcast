import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const toArr = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

async function getXml(url) {
	const r = await fetch(url, { headers: { 'user-agent': 'rss-audit/1.0' } });
	if (!r.ok) throw new Error(`${url} ${r.status}`);
	return r.text();
}

const sourceXml = await getXml('https://feed.reversim.com/');
const source = parser.parse(sourceXml);
const sourceItems = toArr(source?.rss?.channel?.item);

const localRssXml = readFileSync('/Users/ran.tavory/dev/src/github.com/reversim/podcast/dist/rss.xml', 'utf8');
const localRss = parser.parse(localRssXml);
const localRssItems = toArr(localRss?.rss?.channel?.item);

const localPodcastXml = readFileSync('/Users/ran.tavory/dev/src/github.com/reversim/podcast/dist/podcast.xml', 'utf8');
const localPodcast = parser.parse(localPodcastXml);
const localPodcastItems = toArr(localPodcast?.rss?.channel?.item);

const normDate = (raw) => {
	const t = Date.parse(raw);
	return Number.isNaN(t) ? String(raw) : new Date(t).toISOString();
};
const keyOf = (item) => `${item.title}||${normDate(item.pubDate)}`;
const sourceKeySet = new Set(sourceItems.map(keyOf));
const localRssKeySet = new Set(localRssItems.map(keyOf));
const missingInLocal = [...sourceKeySet].filter((k) => !localRssKeySet.has(k));
const localSubsetInSourceOrder = sourceItems
	.filter((item) => localRssKeySet.has(keyOf(item)))
	.map((item) => item.title);
const sourceOrderTitles = sourceItems.map((item) => item.title);
const sourceOrderMatch = JSON.stringify(localSubsetInSourceOrder) === JSON.stringify(sourceOrderTitles);

const getAudioTail = (url) => {
	if (!url) return null;
	const clean = url.split('?')[0];
	const last = clean.split('/').pop() ?? '';
	return last || null;
};

const sourceAudioTails = sourceItems.map((i) => getAudioTail(i.enclosure?.url)).filter(Boolean);
const localPodcastAudioTails = localPodcastItems
	.map((i) => getAudioTail(i.enclosure?.url))
	.filter(Boolean);
const localPodcastAudioTailSet = new Set(localPodcastAudioTails);
const sourceAudioMissingInLocalPodcast = sourceAudioTails.filter(
	(tail) => !localPodcastAudioTailSet.has(tail)
);

console.log(
	JSON.stringify(
		{
			source_feed_items: sourceItems.length,
			local_rss_items: localRssItems.length,
			local_podcast_items: localPodcastItems.length,
			source_title_pubdate_missing_in_local_rss: missingInLocal.length,
			source_order_match_within_local_rss: sourceOrderMatch,
			source_audio_items: sourceAudioTails.length,
			podcast_audio_items: localPodcastAudioTails.length,
			source_audio_missing_in_local_podcast: sourceAudioMissingInLocalPodcast.length,
			missing_examples: missingInLocal.slice(0, 5),
			missing_audio_examples: sourceAudioMissingInLocalPodcast.slice(0, 5),
		},
		null,
		2
	)
);
