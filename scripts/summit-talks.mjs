#!/usr/bin/env node
// Builds src/data/summit-talks.json: the talks of each Reversim Summit, from the public YouTube playlists.
// The site links to the videos on YouTube (it does not host or publish them again).
// Run: node scripts/summit-talks.mjs     (needs yt-dlp; run it one time after each Summit)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The playlist of each year, as embedded on summit.reversim.com/<year>/. Add a line after each Summit.
const PLAYLISTS = {
  2016: 'PLqXy0aX6TzQrwbJ_4hG_C9oGQmUDdB2gh',
  2017: 'PLqXy0aX6TzQrRE_sAtkqBsJAdFQOGme8O',
  2018: 'PLqXy0aX6TzQo7_HyHWeN0I0Cldr20g1A8',
  2019: 'PLqXy0aX6TzQqzJWXJZOKxGuF4W8hJEa5s',
  2020: 'PLqXy0aX6TzQqdhzY9jqew2sb33hhDXAHf',
  2021: 'PLqXy0aX6TzQryGoAdbyPevKocQxMJzg8_',
  2022: 'PLqXy0aX6TzQrVZn7A42IWfYstZRAv2rGq',
  2024: 'PLqXy0aX6TzQqQ8tIs2Xm_OWLOFxgHTnM0',
  2025: 'PLqXy0aX6TzQqBTdWTLnN--urikR5CFIaz',
};

// Titles look like "Talk title / Speaker Name" (also " - " or " | " in older years).
export function splitTitle(raw) {
  const title = raw.replace(/\s+/g, ' ').trim();
  const isName = (s) => /^[\p{L}.'’-]+( [\p{L}.'’-]+){1,3}(( & | and |, )[\p{L}.'’-]+( [\p{L}.'’-]+){1,3})*$/u.test(s) && s.length <= 60;
  // "/" and "//" work with or without spaces; dashes and "|" need spaces (titles have hyphens).
  for (const sep of [/\s*\/\/\s*/g, /\s*\/\s*/g, / \| /g, / [-–—] /g]) {
    const hits = [...title.matchAll(sep)];
    const last = hits[hits.length - 1];
    if (!last || !last.index) continue;
    const a = title.slice(0, last.index).trim(), b = title.slice(last.index + last[0].length).trim();
    if (isName(b)) return { title: a, speaker: b };
    if (isName(a)) return { title: b, speaker: a };
  }
  return { title, speaker: '' };
}

function main() {
  const talks = [];
  for (const [year, list] of Object.entries(PLAYLISTS)) {
    const out = execFileSync('yt-dlp', ['--flat-playlist', '--no-update', '--no-warnings', '--print', '%(id)s\t%(duration)s\t%(title)s', `https://www.youtube.com/playlist?list=${list}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    let n = 0;
    for (const line of out.split('\n')) {
      const [id, duration, ...rest] = line.split('\t');
      const raw = rest.join('\t');
      if (!id || !raw || /^\[(private|deleted) video\]$/i.test(raw)) continue;
      talks.push({ year: Number(year), id, seconds: Math.round(Number(duration)) || 0, ...splitTitle(raw) });
      n++;
    }
    console.log(`  ${year}: ${n} videos`);
  }
  const file = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'src/data/summit-talks.json');
  writeFileSync(file, JSON.stringify({ playlists: PLAYLISTS, talks }, null, '\t') + '\n');
  console.log(`Done: ${talks.length} talks → ${file}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
