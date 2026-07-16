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

## Icon Integration

Use the `@prosefly/astro-components/icons` integration when a project wants
Iconify preloading without the full Lotus theme:

```ts
import { defineConfig } from 'astro/config';
import proseflyIcons from '@prosefly/astro-components/icons';

export default defineConfig({
  integrations: [
    proseflyIcons({
      preload: ['lucide:star', 'simple-icons:github'],
    }),
  ],
});
```

The integration can scan `src/**/*.astro`, `src/**/*.md`, and `src/**/*.mdx`
for static icon usage. Set `scan: false` to disable that behavior or `apiBase`
to point at an internal Iconify-compatible endpoint.

## Package Manager Tabs

Use the `@prosefly/astro-components/package-manager-tabs` remark plugin to turn
compatible shell snippets into synced tab groups:

```ts
import { defineConfig } from 'astro/config';
import { remarkPackageManagerTabs } from '@prosefly/astro-components/package-manager-tabs';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkPackageManagerTabs],
  },
});
```

The plugin recognizes common `npm` commands and can generate tabs for Node and
Python package managers. Lotus enables this transform by default.

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
