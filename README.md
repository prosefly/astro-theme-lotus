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
  schema: docsSchema(),
});

export const collections = { docs };
```

Create docs pages under `src/content/docs/`. Lotus injects the docs page route,
the Markdown source route, and the search index route from `docsBase`. With the
default `docsBase: '/docs'`, `src/content/docs/index.mdx` renders at `/docs/`.

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
│   └── astro-theme-lotus/
│       └── src/
│           ├── components/
│           ├── layouts/
│           ├── lib/
│           ├── routes/
│           └── styles/
├── src/
│   ├── components/
│   ├── content/
│   │   └── docs/
│   ├── content.config.ts
│   └── theme.config.ts
└── package.json
```

- `packages/astro-theme-lotus/` contains the installable Astro integration and
  bundled theme templates.
- `@prosefly/astro-components` is consumed as a published npm package.
- `src/theme.config.ts` defines site metadata, appearance, navigation, actions,
  socials, docs base path, sidebars, and footer links for this example site.
- `src/content/docs/` holds the documentation pages that drive subnav and
  section sidebars.

## Theme configuration

Lotus accepts configuration through `lotus(themeConfig)`.

- MDX-powered documentation pages.
- Built-in search dialog backed by a generated `search.json` index.
- Per-page Markdown source export at `*.md`.
- Dark mode foundation with light, dark, or system defaults.
- Configurable navigation, header actions, social links, sidebars, and footer
  sections.
- Configurable accent palette, gray palette, font tokens, and corner radius.
- Configurable docs route base path.
- Component overrides for selected shell pieces such as search and theme mode
  controls.
- Optional Expressive Code, package-manager tab transforms, and Iconify preload
  configuration.

## Content structure

Pages under `src/content/docs/` define the docs experience by default. The root
index page renders at the configured `docsBase`, and nested pages use
`sidebar.order` or `order` frontmatter to control sorting. The `sidebars` config
decides which top-level section owns each page and drives both the docs subnav
and the section sidebar.

This repository's example site uses the default `docsLoader()` with
`docsBase: '/docs'`, so docs content lives under `src/content/docs/`. The root
homepage is a normal Astro page at `src/pages/index.astro`.

Frontmatter also controls table of contents behavior, previous/next links,
search inclusion, draft filtering, and optional slug overrides.

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
