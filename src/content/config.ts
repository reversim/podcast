import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		date: z.date(),
		tags: z.array(z.string()).optional(),
		episode: z.number().int().optional(),
		audio_url: z.string().url().optional(),
		cover_image: z.string().optional(),
		summary: z.string().optional(),
		legacy_url: z.string().url().optional(),
		legacy_path: z.string().optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { posts };
