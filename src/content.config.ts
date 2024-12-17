import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { docsLoader } from "@astrojs/starlight/loaders";

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
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
