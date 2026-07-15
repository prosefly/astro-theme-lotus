import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export interface DocsLoaderOptions {
  base?: string;
  pattern?: string;
}

export function docsLoader(options: DocsLoaderOptions = {}) {
  return glob({
    pattern: options.pattern ?? '**/*.mdx',
    base: options.base ?? './src/content/docs',
  });
}

export const docsSchema = z.object({
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
});
