import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		date: z.date(),
		tags: z.array(z.string()).optional(),
		episode: z.number().int().optional(),
		audio_url: z.url().optional(),
		cover_image: z.string().optional(),
		summary: z.string().optional(),
		legacy_url: z.url().optional(),
		legacy_path: z.string().optional(),
		aliases: z.array(z.string()).optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { posts };
