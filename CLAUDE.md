# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reversim Podcast ("רברס עם פלטפורמה") — a Hebrew-language tech podcast website built with Astro. The site hosts 500+ episodes migrated from Blogger, with RSS/podcast feeds, Pagefind search, and Decap CMS for content management. Deployed to GitHub Pages at `www.reversim.com`.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Local dev server
npm run build            # Production build (includes Pagefind indexing)
npm run preview          # Preview production build locally

make verify              # Full verification: npm test + audit + build-pages + rss-compare
make build-pages         # Build for GitHub Pages (www.reversim.com)
```

Migration/validation scripts (rarely needed):
```bash
npm run migrate:blogger        # Fetch posts from reversim.com
npm run migrate:validate       # Validate post counts match source
npm run migrate:audit          # Sample audit of migration quality
npm run rss:compare            # Compare source RSS vs generated feeds
```

Unit tests use Vitest (`npm test`). `make verify` is the full validation suite. `make validate` compares with the old Blogger sitemap, which is gone since the move to GitHub Pages, so it is not part of `verify`.

## Architecture

**Framework:** Astro 7 (static site generator), TypeScript, no backend/database.

**Content:** Markdown files with YAML frontmatter in `src/content/posts/`. Schema defined in `src/content/config.ts` using Zod. Posts have optional fields: `episode`, `audio_url`, `tags`, `cover_image`, `summary`, `draft`. Most post bodies contain raw HTML (migrated from Blogger).

**Routing:** File-based in `src/pages/`. Dynamic routes: `[year]/[month]/[slug].astro` for posts, `page/[page].astro` for pagination. Feed generators: `rss.xml.ts`, `podcast.xml.ts` (iTunes), `atom.xml.ts`.

**Key modules:**
- `src/lib/posts.ts` — post collection queries and sorting
- `src/lib/urls.ts` — base URL helper
- `src/components/` — Astro components (BaseLayout, PostCard, Pagination, SubscribeButtons, etc.)
- `scripts/` — Node.js migration and validation scripts

**CMS:** Decap CMS (formerly Netlify CMS) configured at `public/admin/config.yml`, accessible at `/admin`.

**Search:** Pagefind — indexes at build time, runs client-side.

**Deployment:** GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to main. Custom domain `www.reversim.com` configured via `public/CNAME`.

## Content Conventions

- All user-facing content is in **Hebrew (RTL)**
- Episode posts follow the naming pattern: `YYYY-MM-NNN-slug.md` (NNN = episode number)
- The site serves three feed formats: RSS, Atom, and iTunes podcast XML
- Images go in `public/images/`; Blogger-migrated images are in `public/images/blogger/`
