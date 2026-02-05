# Reversim Podcast Site (Astro + Decap CMS)

This repository hosts the Reversim blog/podcast as a static Astro site designed for Hebrew (RTL) content, with a Decap CMS editing UI.

## Quick Start

```sh
npm install
npm run dev
```

## Migration

The migration script pulls the full list of post URLs from the blog sitemap and then fetches each post page to preserve the HTML content.

```sh
npm run migrate:blogger
npm run migrate:validate
```

Outputs go to `src/content/posts/` as Markdown files with HTML bodies. MP3 URLs remain untouched.

## Decap CMS (Editing UI)

The CMS lives at `/admin` after deployment. It uses the GitHub backend, which requires an OAuth server.

1. Deploy a Decap OAuth server (e.g., the official `decap-cms-oauth` app on Render, Vercel, or Cloudflare).
2. Update `public/admin/config.yml`:
   - `repo`: GitHub org/repo
   - `base_url`: your OAuth server URL
   - `auth_endpoint`: `/auth`

After this, editors can add posts through the UI.

## GitHub Pages

1. Set the correct `site` in `astro.config.mjs` (e.g., `https://www.reversim.com`).
2. If you use a project page (not a custom domain), set `ASTRO_BASE` to `/<repo>` during build.
3. A GitHub Actions workflow is included at `.github/workflows/deploy.yml` to build and deploy `dist/`.

## Podcast Cover Art

Replace `public/podcast-cover.svg` with a 1400x1400 or 3000x3000 JPG/PNG for maximum podcast app compatibility. Update the URL in `src/pages/podcast.xml.ts` if needed.

## Commands

- `npm run dev`: local dev server
- `npm run build`: production build
- `npm run preview`: preview build
- `npm run migrate:blogger`: fetch and convert posts
- `npm run migrate:validate`: compare sitemap URL count to generated files
