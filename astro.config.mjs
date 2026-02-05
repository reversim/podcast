// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.reversim.com',
	base: process.env.ASTRO_BASE ?? '/',
	trailingSlash: 'never',
	build: {
		format: 'file',
	},
});
