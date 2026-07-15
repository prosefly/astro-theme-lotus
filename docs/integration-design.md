# Lotus Astro integration design

Lotus is currently a starter theme with source files in `src/`. The integration
skeleton starts the package boundary for a future installable docs integration
without moving route, layout, or content ownership in this phase.

## Goals

- Provide an installable Astro integration through `@prosefly/astro-theme-lotus`.
- Let users configure the docs shell with `lotus({ site, appearance, nav, actions, footer })`.
- Keep navigation, header actions, and footer links configurable from user config.
- Support content-driven docs sections so sidebars and section navigation can be
  derived from MDX content collections.
- Enable MDX support from the integration.
- Configure design tokens for accent, gray, radius, text, surfaces, and
  backgrounds.
- Stay compatible with `@prosefly/astro-components` for reusable MDX components.

## Non-goals

- Full route migration out of `src/pages`.
- Moving layout components out of `src/components/layout`.
- Replacing `src/theme.config.ts` entirely.
- Search.
- i18n.
- Versioned docs.
- Publishing the package to npm.
- Reimplementing or wrapping Starlight.

## Proposed user config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';

export default defineConfig({
  integrations: [
    lotus({
      site: {
        title: 'Lotus Docs',
        description: 'Documentation built with Lotus.',
        logo: '/logo.svg',
      },
      appearance: {
        accent: 'emerald',
        gray: 'zinc',
        radius: 'medium',
      },
      nav: [
        { label: 'Docs', href: '/docs/' },
        { label: 'Components', href: '/docs/components/callout/' },
      ],
      actions: [
        { label: 'GitHub', href: 'https://github.com/prosefly/astro-theme-lotus' },
      ],
      footer: {
        sections: [
          {
            title: 'Resources',
            links: [{ label: 'Getting started', href: '/docs/guide/getting-started/' }],
          },
        ],
      },
    }),
  ],
});
```

The first skeleton only wires MDX and Tailwind through `astro:config:setup`. A
later phase can consume these options to provide routes, virtual modules, and
theme config loading.

## Migration path

The current starter keeps theme settings in `src/theme.config.ts`. The future
integration should migrate those fields into the `lotus()` options without
forcing users to rewrite content:

- `site.title`, `site.description`, and `site.logo` map to the current site
  metadata.
- `appearance.accent`, `appearance.gray`, and `appearance.radius` map to the
  current appearance config and generated CSS variables.
- `nav` maps to the current top navigation links.
- `actions` maps to the current header action links.
- `footer.sections` maps to the current footer section model.
- Docs sections should continue to come from content collections and page
  frontmatter until the integration owns the docs shell.

During the transition, projects can continue editing `src/theme.config.ts`.
When the integration owns the shell, the starter can become an example project
that calls `lotus({ site, appearance, nav, actions, footer })`.

## Package relationship

`@prosefly/astro-theme-lotus` owns the docs shell: integration setup, docs
layout, navigation, actions, footer, content-driven sections, and design token
application.

`@prosefly/astro-components` owns reusable MDX components such as callouts,
badges, cards, steps, and tabs. It stays shell-agnostic and consumes semantic
tokens exposed by Lotus:

- `--pl-text`
- `--pl-text-muted`
- `--pl-background`
- `--pl-surface`
- `--pl-accent`
- `--pl-accent-soft`
- `--pl-accent-contrast`
- Radius tokens such as `--pl-radius-sm`, `--pl-radius-md`, and
  `--pl-radius-lg`.
