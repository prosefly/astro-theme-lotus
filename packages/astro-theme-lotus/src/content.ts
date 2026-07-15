import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';

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

const paginationItemSchema = z.union([
  z.boolean(),
  z.string(),
  z.object({
    link: z.string().optional(),
    label: z.string().optional(),
  }),
]);

const headConfigSchema = z.object({
  tag: z.string(),
  attrs: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).optional()).optional(),
  content: z.string().optional(),
});

const badgeSchema = z.union([
  z.string(),
  z.object({
    text: z.string(),
    variant: z.string().optional(),
    class: z.string().optional(),
  }),
]);

const sidebarSchema = z.object({
  label: z.string().optional(),
  order: z.number().optional(),
  hidden: z.boolean().optional(),
  badge: badgeSchema.optional(),
  attrs: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).optional()).optional(),
});

const heroActionSchema = z.object({
  text: z.string(),
  link: z.string(),
  variant: z.enum(['primary', 'secondary', 'minimal']).optional(),
  icon: z.string().optional(),
  attrs: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).optional()).optional(),
});

const heroImageSchema = z.union([
  z.object({
    file: z.string(),
    alt: z.string().optional(),
  }),
  z.object({
    dark: z.string(),
    light: z.string(),
    alt: z.string().optional(),
  }),
  z.object({
    html: z.string(),
  }),
]);

const baseDocsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  editUrl: z.union([z.string(), z.boolean()]).optional(),
  head: z.array(headConfigSchema).optional(),
  tableOfContents: z
    .union([
      z.literal(false),
      z.object({
        minHeadingLevel: z.number().min(2).max(6).optional(),
        maxHeadingLevel: z.number().min(2).max(6).optional(),
      }),
    ])
    .optional(),
  template: z.enum(['doc', 'splash']).default('doc'),
  hero: z
    .object({
      title: z.string().optional(),
      tagline: z.string().optional(),
      image: heroImageSchema.optional(),
      actions: z.array(heroActionSchema).optional(),
    })
    .optional(),
  banner: z
    .object({
      content: z.string(),
    })
    .optional(),
  lastUpdated: z.union([z.date(), z.boolean()]).optional(),
  prev: paginationItemSchema.optional(),
  next: paginationItemSchema.optional(),
  pagefind: z.boolean().default(true),
  draft: z.boolean().default(false),
  sidebar: sidebarSchema.optional(),
  order: z.number().optional(),
});

type DocsSchemaExtension = ReturnType<typeof z.object>;
type BaseDocsSchema = typeof baseDocsSchema;

export interface DocsSchemaOptions {
  extend?: DocsSchemaExtension | ((context: SchemaContext) => DocsSchemaExtension);
}

export function docsSchema(options: DocsSchemaOptions = {}): (context: SchemaContext) => BaseDocsSchema {
  return (context: SchemaContext) => {
    const extension =
      typeof options.extend === 'function' ? options.extend(context) : options.extend;

    if (extension) {
      return baseDocsSchema.extend(extension.shape) as BaseDocsSchema;
    }

    return baseDocsSchema;
  };
}
