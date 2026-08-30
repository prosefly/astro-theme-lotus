import { defineConfig } from 'astro/config';
import lotus, { type LotusIntegrationOptions } from '@prosefly/astro-theme-lotus';
import openapi, { loadOpenApiDocsNav } from '@prosefly/astro-openapi';
import theme from './theme.config.json';

const themeConfig = theme as LotusIntegrationOptions;
const docsNav = [...(themeConfig.docsNav ?? [])];

docsNav.push({
  slug: 'api',
  label: 'API Reference',
  icon: 'lucide:braces',
  items: loadOpenApiDocsNav({
    methodBadge: { variant: 'soft' },
  }),
});

export default defineConfig({
  site: 'https://astro-theme-lotus.prosefly.dev',
  integrations: [
    lotus({
      ...themeConfig,
      docsNav,
      components: {
        HeaderSocialIcons: './src/components/lotus/HeaderSocialIcons.astro',
        ThemeSwitch: './src/components/lotus/ThemeSwitch.astro',
      },
    }),
    openapi({
      file: './src/openapi.yaml',
      base: '/api',
      operationBase: 'endpoints',
      groupBy: 'auto',
    }),
  ],
});
