// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.reversim.com',
	base: '/',
	trailingSlash: 'never',
	build: {
		format: 'file',
	},
	redirects: {
		'/feeds/posts/default': 'https://feed.reversim.com/',
	},
});
