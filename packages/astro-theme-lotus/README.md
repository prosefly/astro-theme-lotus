# @prosefly/astro-theme-lotus

Installable Astro documentation theme for Astro v7, Tailwind CSS v4, and MDX.

```sh
npm install @prosefly/astro-theme-lotus @prosefly/astro-components
```

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
  schema: docsSchema,
});

export const collections = { docs };
```

Add MDX pages in `src/content/docs/`. Lotus injects the route from
`themeConfig.docs.basePath` and renders the bundled docs layout, navigation,
table of contents, and footer.
