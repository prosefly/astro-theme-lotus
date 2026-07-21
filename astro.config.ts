import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';

export default defineConfig({
  site: 'https://astro-theme-lotus.prosefly.dev',
  integrations: [
    lotus({
      components: {
        HeaderSocialIcons: './src/components/lotus/HeaderSocialIcons.astro',
        ThemeSwitch: './src/components/lotus/ThemeSwitch.astro',
      },
    }),
  ],
});
