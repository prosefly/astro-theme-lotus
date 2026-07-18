import { defineConfig } from 'astro/config';
import lotus from '@prosefly/astro-theme-lotus';
import themeConfig from './src/theme.config';

export default defineConfig({
  site: 'https://astro-theme-lotus.prosefly.dev',
  integrations: [lotus(themeConfig)],
});
