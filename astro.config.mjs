// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeA11y from './src/lib/rehypeA11y.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.reversim.com',
	base: '/',
	trailingSlash: 'never',
	build: {
		format: 'file',
	},
	// Astro 7 default ('jsx') removes spaces between elements, for example between menu links.
	// true is the lossless compression of Astro 6.
	compressHTML: true,
	markdown: {
		// The unified processor (remark/rehype) keeps the Markdown output of Astro 6.
		processor: unified({
			rehypePlugins: [rehypeA11y],
		}),
	},
});
