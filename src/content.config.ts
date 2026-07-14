import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const docs = defineCollection({
  type: 'content',
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
