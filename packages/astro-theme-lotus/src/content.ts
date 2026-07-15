import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const docs = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/docs',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
    section: z.string().optional(),
    tableOfContents: z
      .union([
        z.boolean(),
        z.object({
          minHeadingLevel: z.number().min(2).max(6).optional(),
          maxHeadingLevel: z.number().min(2).max(6).optional(),
        }),
      ])
      .optional(),
  }),
});

export const collections = { docs };
