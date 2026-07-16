import { defineCollection } from 'astro:content';
import { docsLoader, docsSchema } from '@prosefly/astro-theme-lotus/content';

const docs = defineCollection({
  loader: docsLoader({
    base: './src/content',
  }),
  schema: docsSchema(),
});

export const collections = { docs };
