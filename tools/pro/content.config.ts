import { defineCollection } from 'astro:content';
import { type Loader } from 'astro/loaders';
import { docsLoader, docsSchema } from '@prosefly/astro-theme-lotus/content';
import { openApiLoader, openApiSchema } from '@prosefly/astro-openapi';

const docs = defineCollection({
  loader: docsLoader() as Loader,
  schema: docsSchema(),
});

const api = defineCollection({
  loader: openApiLoader() as Loader,
  schema: openApiSchema(),
});

export const collections = { docs, api };
