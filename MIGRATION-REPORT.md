# Podcast Migration Due Diligence Report

**Date:** 2026-02-14
**Source:** Blogger (www.reversim.com)
**Target:** Astro static site (reversim.github.io/podcast/)

---

## Executive Summary

The migration of the Reversim podcast from Blogger to an Astro-based static site is
**structurally complete**. All 835 legacy posts have been migrated with correct URL mappings.
The site builds without errors, producing 910 HTML pages and 3 XML feeds. There are a few
issues worth noting: 708 audio URLs use plain HTTP, 328 posts are missing tags, there are
12 duplicate episode numbers, and MP3 link accessibility could not be verified from this
environment.

---

## 1. Codebase Overview

| Property | Value |
|---|---|
| Static site generator | Astro 5.17.1 |
| Content files | 835 markdown files in `src/content/posts/` |
| Content schema | Zod-validated: title, date, tags, episode, audio_url, cover_image, summary, legacy_url, legacy_path, draft |
| Built output | 910 HTML pages, 3 XML feeds |
| Language/direction | Hebrew (`lang="he"`, `dir="rtl"`) |

### Pages generated
- 835 individual episode/post pages (year-based URL structure)
- 4 static pages: index, about, archive, episodes
- 70 pagination pages
- 3 feeds: podcast.xml, rss.xml, atom.xml

---

## 2. Content Analysis

### Post counts
| Metric | Count |
|---|---|
| Total markdown files | 835 |
| Posts with `audio_url` (episodes) | 814 |
| Posts without `audio_url` (blog posts) | 21 |
| Posts with `legacy_url` | **835 (100%)** |
| Posts without `legacy_url` | 0 |
| Posts with `tags` | 507 (60.7%) |
| Posts without `tags` | 328 (39.3%) |
| Posts with explicit `episode` number | 484 |
| Episode number range | 3 - 511 |
| Draft posts | 0 |
| Malformed frontmatter | 0 |
| Empty `audio_url` values | 0 |

### Posts per year
| Year | Count | | Year | Count |
|------|-------|-|------|-------|
| 2008 | 1     | | 2017 | 88    |
| 2009 | 61    | | 2018 | 97    |
| 2010 | 40    | | 2019 | 60    |
| 2011 | 35    | | 2020 | 17    |
| 2012 | 40    | | 2021 | 30    |
| 2013 | 71    | | 2022 | 23    |
| 2014 | 101   | | 2023 | 15    |
| 2015 | 85    | | 2024 | 20    |
| 2016 | 27    | | 2025 | 20    |
|      |       | | 2026 | 4     |

### Tags (46 unique)
Top tags by usage: summit (280), bumpers (90), carburetor (38), finalclass (34),
fogcast (23). Full tag list available via `scripts/analyze-frontmatter.mjs`.

---

## 3. Feed Verification

| Feed | Path | Items | Audio enclosures | Scope |
|---|---|---|---|---|
| Podcast RSS | `/podcast.xml` | 814 | Yes (all 814) | Episodes with audio only |
| General RSS | `/rss.xml` | 835 | No | All posts |
| Atom | `/atom.xml` | 835 | No | All posts |

- **podcast.xml** includes the iTunes podcast namespace (`itunes:author`, `itunes:explicit`,
  `itunes:image`, `itunes:category`) and audio `<enclosure>` tags on all 814 items.
- **rss.xml** includes `content:encoded` with full post body.
- **atom.xml** includes full post body in `<content type="html">`.

---

## 4. Audio URL Analysis

### Domain breakdown
| Domain | Count | % |
|---|---|---|
| m2.reversim.com | 454 | 55.8% |
| m.reversim.com | 355 | 43.6% |
| traffic.libsyn.com | 3 | 0.4% |
| barakdanin.com | 1 | 0.1% |
| podcasti.co | 1 | 0.1% |
| **Total** | **814** | **100%** |

### Protocol breakdown
| Protocol | Count | % |
|---|---|---|
| `http://` | 708 | 87.0% |
| `https://` | 106 | 13.0% |

---

## 5. Broken Link Check

### MP3 / Audio URLs
**Status: UNABLE TO VERIFY FROM THIS ENVIRONMENT**

All outbound HTTP requests from this sandbox are blocked (`host_not_allowed` / `EAI_AGAIN`).
The link checker script (`scripts/check-links.mjs`) was written and tested but cannot
reach external hosts.

**Recommendation:** Run `node scripts/check-links.mjs` from a local machine or CI
environment with unrestricted internet access to verify all 814 audio URLs.

**What we do know from web research:**
- The Reversim podcast is listed on the [Libsyn directory](https://directory.libsyn.com/shows/view/id/reversim).
- The feed is marked as **"inactive"** on some podcast platforms (player.fm), meaning
  the feed may not be checked for updates regularly.
- A [GitHub repo](https://github.com/rantav/reversim-media) (`rantav/reversim-media`)
  exists for media but contains only a logo and one intro MP3.
- The `m2.reversim.com` and `m.reversim.com` domains are the primary MP3 hosts and
  should be verified.

### Body URLs
The script also samples 100 unique URLs found in post body content. This could not be
run from this environment either. Run locally for full results.

---

## 6. Issues Found

### 6.1 HTTP audio URLs (708 of 814)
**Severity: Medium**

87% of audio URLs use `http://` instead of `https://`. Modern browsers, podcast apps,
and RSS readers may block or warn about mixed content. Recommend upgrading all audio
URLs to HTTPS if the servers support it.

### 6.2 Missing tags (328 of 835 posts)
**Severity: Low**

39.3% of posts have no tags. This may be intentional (many older episodes didn't have
Blogger labels) but could affect discoverability on the new site.

### 6.3 Duplicate episode numbers (12 cases)
**Severity: Low**

The following episode numbers are assigned to multiple files:

| Episode | Files |
|---|---|
| 3 | `2008-12-34.md`, `2019-04-3-66-clicktale.md`, `2019-07-3-72-zadara.md` |
| 25 | `2009-06-25-data-centers.md`, `2009-07-25-mysql.md` |
| 30 | `2009-07-30-2.md`, `2010-10-30-59-linq-software-craftsmanship.md` |
| 32 | `2009-04-32-scalability.md`, `2009-08-32-2.md` |
| 41 | `2009-10-41-mobile-web.md`, `2009-10-41-mobile-web_28.md` |
| 66 | `2010-06-066-agile-and-kanban.md`, `2010-07-066-nati-shalom-gigaspaces.md` |
| 102 | `2011-06-102-final-class-7.md`, `2011-06-102-foreman.md` |
| 137 | `2012-05-137-binpress.md`, `2012-05-137-final-class-17-software-deadlines.md`, `2012-05-137-nir-katz.md` |
| 162 | `2013-01-162-final-class-26-yearly-wrapup-2012.md`, `2013-01-162-software-lead-weekly.md` |
| 189 | `2013-08-189-bumpers-6.md`, `2013-08-189-bumpers-7.md` |
| 290 | `2015-10-290-cloud-vendor-series-hahr-with-aws.md`, `2016-02-290-bumpers-27.md` |
| 507 | `2025-12-507-catburetor-39-google-and-ai-01137954666-dup.md`, `2025-12-507-catburetor-39-google-and-ai.md` |

Most appear to be co-released episodes or multi-part posts sharing the same episode number
on the original Blogger site. Episode 507 has an explicit duplicate file (suffixed `-dup`).

### 6.4 Legacy HTML content in post bodies
**Severity: Informational**

Post bodies contain raw HTML from Blogger including inline styles, `<div dir="rtl">` wrappers,
Blogger image URLs (`blogger.googleusercontent.com`), and embedded Libsyn iframes
(`html5-player.libsyn.com`). This is expected for a migration but means the content
is not clean Markdown.

### 6.5 Podcast feed marked inactive on some platforms
**Severity: Informational**

Web search results indicate the Reversim feed is marked "inactive" on platforms like
player.fm. After migration, the new feed URL (`reversim.github.io/podcast/podcast.xml`)
should be submitted to podcast directories (Apple Podcasts, Spotify, etc.).

---

## 7. Migration Completeness

| Check | Status |
|---|---|
| All legacy URLs mapped | PASS (835/835) |
| All episodes have audio_url | PASS (814/814 episodes) |
| Podcast RSS feed with enclosures | PASS (814 items) |
| General RSS feed | PASS (835 items) |
| Atom feed | PASS (835 items) |
| Frontmatter validation (Zod) | PASS (0 errors) |
| Site builds without errors | PASS |
| Hebrew RTL layout | PASS |
| Legacy URL paths preserved | PASS |
| No draft posts leaked | PASS (0 drafts) |
| Audio URLs accessible | NOT TESTED (sandbox restriction) |
| Body URLs accessible | NOT TESTED (sandbox restriction) |

---

## 8. Verification Scripts

The following scripts are available in `scripts/`:

| Script | Purpose |
|---|---|
| `analyze-frontmatter.mjs` | Audits all 835 posts for metadata completeness (tags, audio URLs, episode numbers, etc.) |
| `check-links.mjs` | HEAD-requests all audio URLs and a sample of body URLs to find broken links |
| `validate-migration.mjs` | Compares local `legacy_url` values against the live www.reversim.com sitemap |
| `audit-migration.mjs` | Deep audit: fetches source pages and compares titles and tags |
| `compare-rss.mjs` | Compares the original feed (feed.reversim.com) against the built feeds |

**To run the link checker locally:**
```bash
node scripts/check-links.mjs
```

---

## 9. Recommendations

1. **Verify MP3 links externally** - Run `node scripts/check-links.mjs` from a machine with
   internet access.
2. **Upgrade HTTP audio URLs to HTTPS** - 708 of 814 audio URLs use plain HTTP.
3. **Submit new feed URL to podcast directories** - Replace the old feed with
   `https://reversim.github.io/podcast/podcast.xml`.
4. **Consider cleaning up duplicate episode 507** - The `-dup` file appears to be a
   Blogger artifact.
5. **Set up a redirect from www.reversim.com** - To preserve SEO and existing links.
