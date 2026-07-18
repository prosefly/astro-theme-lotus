# @prosefly/astro-theme-lotus

Installable Astro documentation theme for Astro v7, Tailwind CSS v4, and MDX.

```sh
npm install @prosefly/astro-theme-lotus
```

Install `@prosefly/astro-components` directly when your own MDX or Astro files
import shared components such as cards, steps, tabs, or callouts.

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';
import themeConfig from './src/theme.config';

export default defineConfig({
  integrations: [lotus(themeConfig)],
});
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
`themeConfig.docsBase` when you want docs under a prefix such as `/docs`.

Lotus renders the bundled docs layout, navigation, search, table of contents,
and footer. The integration also injects a Markdown source route at `*.md` and a
search index route at `search.json`.

Common integration options include `docsBase`, `sidebars`, `pageActions`,
`footer`, `iconify`, `expressiveCode`, `packageManagerTabs`, and `components`
overrides.
