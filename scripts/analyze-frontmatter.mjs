import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const POSTS_DIR = "/home/user/podcast/src/content/posts";

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

const result = {
  total_files: 0,
  with_audio_url: 0,
  without_audio_url: 0,
  audio_url_domains: {},
  with_legacy_url: 0,
  without_legacy_url: 0,
  files_without_legacy_url: [],
  with_tags: 0,
  without_tags: 0,
  all_tags: {},
  posts_per_year: {},
  draft_count: 0,
  draft_files: [],
  empty_audio_url: [],
  malformed_frontmatter: [],
  episode_number_stats: {
    with_episode_number: 0,
    max_episode: -Infinity,
    min_episode: Infinity,
  },
};

for (const file of files) {
  result.total_files++;

  const content = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");

  // Extract frontmatter between --- markers
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    result.malformed_frontmatter.push(file);
    result.without_audio_url++;
    result.without_legacy_url++;
    result.files_without_legacy_url.push(file);
    result.without_tags++;
    continue;
  }

  let fm;
  try {
    fm = YAML.parse(fmMatch[1]);
  } catch {
    result.malformed_frontmatter.push(file);
    result.without_audio_url++;
    result.without_legacy_url++;
    result.files_without_legacy_url.push(file);
    result.without_tags++;
    continue;
  }

  if (!fm || typeof fm !== "object") {
    result.malformed_frontmatter.push(file);
    result.without_audio_url++;
    result.without_legacy_url++;
    result.files_without_legacy_url.push(file);
    result.without_tags++;
    continue;
  }

  // audio_url
  if ("audio_url" in fm) {
    const val = fm.audio_url;
    if (val && typeof val === "string" && val.trim() !== "") {
      result.with_audio_url++;
      try {
        const domain = new URL(val).hostname;
        result.audio_url_domains[domain] =
          (result.audio_url_domains[domain] || 0) + 1;
      } catch {
        // not a valid URL but not empty either — still count as with_audio_url
      }
    } else {
      // key present but empty value
      result.without_audio_url++;
      result.empty_audio_url.push(file);
    }
  } else {
    result.without_audio_url++;
  }

  // legacy_url
  if (fm.legacy_url && typeof fm.legacy_url === "string" && fm.legacy_url.trim() !== "") {
    result.with_legacy_url++;
  } else {
    result.without_legacy_url++;
    result.files_without_legacy_url.push(file);
  }

  // tags
  if (Array.isArray(fm.tags) && fm.tags.length > 0) {
    result.with_tags++;
    for (const tag of fm.tags) {
      const t = String(tag).trim();
      if (t) {
        result.all_tags[t] = (result.all_tags[t] || 0) + 1;
      }
    }
  } else {
    result.without_tags++;
  }

  // posts_per_year (from date field)
  if (fm.date) {
    const d = new Date(fm.date);
    if (!isNaN(d.getTime())) {
      const year = String(d.getFullYear());
      result.posts_per_year[year] = (result.posts_per_year[year] || 0) + 1;
    }
  }

  // draft
  if (fm.draft === true) {
    result.draft_count++;
    result.draft_files.push(file);
  }

  // episode number
  if (fm.episode != null) {
    const ep = Number(fm.episode);
    if (!isNaN(ep)) {
      result.episode_number_stats.with_episode_number++;
      if (ep > result.episode_number_stats.max_episode)
        result.episode_number_stats.max_episode = ep;
      if (ep < result.episode_number_stats.min_episode)
        result.episode_number_stats.min_episode = ep;
    }
  }
}

// Clean up edge cases for episode stats when no episodes found
if (result.episode_number_stats.with_episode_number === 0) {
  result.episode_number_stats.max_episode = null;
  result.episode_number_stats.min_episode = null;
}

// Sort posts_per_year by year
const sortedYears = Object.keys(result.posts_per_year).sort();
const sortedPostsPerYear = {};
for (const y of sortedYears) {
  sortedPostsPerYear[y] = result.posts_per_year[y];
}
result.posts_per_year = sortedPostsPerYear;

// Sort all_tags by count descending
const sortedTags = Object.entries(result.all_tags).sort((a, b) => b[1] - a[1]);
const sortedAllTags = {};
for (const [tag, count] of sortedTags) {
  sortedAllTags[tag] = count;
}
result.all_tags = sortedAllTags;

// Sort audio_url_domains by count descending
const sortedDomains = Object.entries(result.audio_url_domains).sort(
  (a, b) => b[1] - a[1]
);
const sortedAudioDomains = {};
for (const [domain, count] of sortedDomains) {
  sortedAudioDomains[domain] = count;
}
result.audio_url_domains = sortedAudioDomains;

console.log(JSON.stringify(result, null, 2));
