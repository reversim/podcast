// @ts-check
import { defineConfig } from 'astro/config';
import rehypeA11y from './src/lib/rehypeA11y.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.reversim.com',
	base: '/',
	trailingSlash: 'never',
	build: {
		format: 'file',
	},
	markdown: {
		rehypePlugins: [rehypeA11y],
	},
});
