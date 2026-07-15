# Astro Theme Lotus

Astro Theme Lotus is an installable documentation theme for Astro v7, Tailwind
CSS v4, and MDX. The `@prosefly/astro-theme-lotus` package owns the docs route,
layouts, navigation chrome, footer, styles, and token system. Your project owns
content and configuration.

## Installation

Install the theme package in an Astro project:

```sh
npm install @prosefly/astro-theme-lotus @prosefly/astro-components
```

Add the integration:

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';
import themeConfig from './src/theme.config';

export default defineConfig({
  integrations: [lotus(themeConfig)],
});
```

Register the docs content collection:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { docsLoader, docsSchema } from '@prosefly/astro-theme-lotus/content';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema,
});

export const collections = { docs };
```

Create docs pages under `src/content/docs/`. Lotus injects the route from
`themeConfig.docs.basePath`, so `src/content/docs/index.mdx` renders at
`/docs/` when `basePath` is `/docs`.

## Development

Run the local development server:

```sh
pnpm run dev
```

Validate content and types:

```sh
pnpm run check
```

Build the static site:

```sh
pnpm run build
```

## Project structure

```txt
.
├── packages/
│   ├── astro-components/
│   └── astro-theme-lotus/
│       └── src/
│           ├── components/
│           ├── layouts/
│           ├── lib/
│           ├── routes/
│           └── styles/
├── src/
│   ├── content/
│   │   └── docs/
│   ├── content.config.ts
│   ├── pages/
│   └── theme.config.ts
└── package.json
```

- `packages/astro-theme-lotus/` contains the installable Astro integration and
  bundled theme templates.
- `packages/astro-components/` contains portable MDX components that consume
  `--pl-*` CSS variables.
- `src/theme.config.ts` defines site metadata, appearance, navigation, actions,
  docs base path, docs sections, and footer links for this example site.
- `src/content/docs/` holds the documentation pages that drive subnav and
  section sidebars.

## Theme configuration

Lotus accepts configuration through `lotus(themeConfig)`.

- MDX-powered documentation pages.
- Dark mode foundation with light, dark, or system defaults.
- Configurable navigation, header actions, and footer sections.
- Configurable accent palette, gray palette, fonts, and corner radius.
- Configurable docs route base path.
- Content-driven subnav and sidebar sections from `docs.sections` and page
  frontmatter.

## Content structure

Pages under `src/content/docs/` define the docs experience. The root index page
renders at `/docs/`, and nested pages use `section` plus `order` frontmatter to
control grouping and sorting. The sidebar for each section is generated from the
content tree, so most navigation changes happen by editing content instead of
templates.

## Design system

Lotus combines Tailwind utilities for layout and spacing with semantic
`--lotus-*` tokens such as `--lotus-background`, `--lotus-text`,
`--lotus-accent`, radius tokens, and `--lotus-docs-chrome-height`. The theme
config sets high-level appearance choices, including `system` theme mode, while
the design system reference documents how those choices map to rendered UI.

Package MDX components consume the `--pl-*` bridge variables that Lotus maps
from its theme tokens.

## License

This project is released under the BSD-3-Clause license. See the repository
license file for the full text.
