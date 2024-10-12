import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		schema: docsSchema({
			extend: ({ doc }) => {
				return z.object({
					isAEP: z.optional(z.boolean()),
					created: z.optional(z.date()),
					updated: z.optional(z.date()),
					id: z.optional(z.number()),
				});
			},
		})
	}),
};
