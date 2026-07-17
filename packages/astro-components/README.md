# @prosefly/astro-components

Reusable Astro components for MDX content.

```astro
---
import { Callout } from '@prosefly/astro-components';
---

<Callout type="tip" title="Reusable">
  Package components use Prosefly CSS custom properties with built-in fallbacks.
</Callout>
```

## Exports

The main entry exports:

- `AccordionItem` and `Accordions`
- `Badge`
- `Callout`
- `Card` and `CardGrid`
- `FileTree`
- `Icon`
- `Steps`
- `TabItem` and `Tabs`

The markdown entry exports:

- `rehypeImageGallery`
- `remarkPackageManagerTabs`

## Icon Integration

Use the `@prosefly/astro-components/icon` integration when a project wants
Iconify preloading without the full Lotus theme:

```ts
import { defineConfig } from 'astro/config';
import proseflyIcon from '@prosefly/astro-components/icon';

export default defineConfig({
  integrations: [
    proseflyIcon({
      preload: ['lucide:star', 'simple-icons:github'],
    }),
  ],
});
```

The integration can scan `src/**/*.astro`, `src/**/*.md`, and `src/**/*.mdx`
for static icon usage. Set `scan: false` to disable that behavior or `apiBase`
to point at an internal Iconify-compatible endpoint.

## Markdown Transforms

Use `@prosefly/astro-components/markdown` for optional markdown transforms:

```ts
import { defineConfig } from 'astro/config';
import { rehypeImageGallery, remarkPackageManagerTabs } from '@prosefly/astro-components/markdown';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkPackageManagerTabs],
    rehypePlugins: [rehypeImageGallery],
  },
});
```

`remarkPackageManagerTabs` recognizes common `npm` commands and can generate
tabs for Node and Python package managers. `rehypeImageGallery` turns paragraphs
that contain only images into gallery figures. Lotus enables both transforms by
default.

Import the image gallery runtime once in the page shell to load styles and
enable previous and next controls for galleries produced by
`rehypeImageGallery`:

```astro
---
import '@prosefly/astro-components/markdown/image-gallery.css';
---

<script>
  import '@prosefly/astro-components/markdown/image-gallery.js';
</script>
```

## Styling

Consumers can theme the components with `--pl-*` custom properties:

- `--pl-text-strong`
- `--pl-text`
- `--pl-text-muted`
- `--pl-background`
- `--pl-surface`
- `--pl-accent`
- `--pl-accent-soft`
- `--pl-accent-contrast`
- `--pl-border-subtle`
- `--pl-font-sans`
- `--pl-font-mono`
- `--pl-radius-sm`
- `--pl-radius-md`
- `--pl-radius-lg`
- `--pl-radius-full`
