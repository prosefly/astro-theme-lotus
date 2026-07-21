import { defineCollection } from 'astro:content';
import { docsLoader, docsSchema } from '@prosefly/astro-theme-lotus/content';
import { openApiLoader, openApiSchema } from '@prosefly/astro-openapi';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

const api = defineCollection({
  loader: openApiLoader(),
  schema: openApiSchema(),
});

export const collections = { docs, api };
