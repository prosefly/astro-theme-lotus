# @prosefly/astro-theme-lotus

Installable documentation theme for Astro v7, Tailwind CSS v4, and MDX.

Lotus gives your Astro project generated docs routes, responsive navigation,
table of contents, search, dark mode, i18n, theme tokens, and docs components
without turning the whole site into a theme fork.

## Start From The Template

Use the starter template for a new documentation site.

```sh
pnpm create astro@latest my-docs --template prosefly/astro-template-lotus-starter
cd my-docs
pnpm dev
```

Template source:
[prosefly/astro-template-lotus-starter](https://github.com/prosefly/astro-template-lotus-starter)

## Add To An Existing Project

```sh
npm install @prosefly/astro-theme-lotus
```

Install `@prosefly/astro-components` directly when your own MDX or Astro files
import shared components such as cards, steps, tabs, or callouts.

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';

export default defineConfig({
  integrations: [lotus()],
});
```

```json
{
  "$schema": "https://astro-theme-lotus.prosefly.dev/schema.json",
  "name": "My Docs",
  "description": "Documentation for my project.",
  "siteNav": [
    { "label": "Docs", "href": "/" },
    { "label": "GitHub", "href": "https://github.com/acme/acme", "external": true }
  ],
  "docsNav": [
    {
      "label": "Guides",
      "items": ["index"]
    }
  ]
}
```

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

Add MDX pages in `src/content/docs/`. By default, Lotus renders those pages
from the site root, similar to Starlight: `src/content/docs/index.mdx` renders
at `/`, and nested files render as matching URL segments. Set
`docsBase` when you want docs under a prefix such as `/docs`.

Lotus renders the bundled docs layout, navigation, search, table of contents,
and footer. The integration also injects a Markdown source route at `*.md` and a
search index route at `search.json`.

Common integration options include `docsBase`, `siteNav`, `docsNav`,
`pageActions`, `footer`, `iconify`, `markdown`, `themeModeControl`, and
`components` overrides.

## Links

- Documentation: <https://astro-theme-lotus.prosefly.dev/docs/overview/>
- Repository: <https://github.com/prosefly/astro-theme-lotus>
- Starter template:
  <https://github.com/prosefly/astro-template-lotus-starter>
