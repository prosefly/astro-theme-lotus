import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import type { LotusThemeConfig } from './lib/theme';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export type LotusIntegrationOptions = Partial<LotusThemeConfig>;

const defaultConfig: LotusThemeConfig = {
  site: {
    title: 'Astro Theme Lotus',
    description: 'A documentation theme for Astro.',
    logo: '/logo.svg',
  },
  appearance: {
    accent: 'indigo',
    gray: 'zinc',
    fontSans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
    defaultTheme: 'system',
    radius: 'medium',
  },
  nav: [{ label: 'Docs', href: '/docs/' }],
  actions: [],
  docs: {
    sections: [
      { slug: 'guide', label: 'Guide', order: 1 },
      { slug: 'components', label: 'Components', order: 2 },
      { slug: 'references', label: 'References', order: 3 },
    ],
  },
  footer: {
    copyright: 'Copyright © 2026 Prosefly.',
    sections: [],
  },
};

function resolveLotusConfig(options: LotusIntegrationOptions): LotusThemeConfig {
  return {
    ...defaultConfig,
    ...options,
    site: {
      ...defaultConfig.site,
      ...options.site,
    },
    appearance: {
      ...defaultConfig.appearance,
      ...options.appearance,
    },
    docs: {
      ...defaultConfig.docs,
      ...options.docs,
    },
    footer: {
      ...defaultConfig.footer,
      ...options.footer,
    },
  };
}

function lotusConfigPlugin(config: LotusThemeConfig): Plugin {
  return {
    name: '@prosefly/astro-theme-lotus/config',
    resolveId(id) {
      if (id === virtualConfigModuleId) {
        return resolvedVirtualConfigModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualConfigModuleId) {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}

export function defineLotusConfig(config: LotusIntegrationOptions): LotusIntegrationOptions {
  return config;
}

export default function lotus(options: LotusIntegrationOptions = {}): AstroIntegration {
  const config = resolveLotusConfig(options);

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        injectRoute({
          pattern: '/docs/[...slug]',
          entrypoint: new URL('./routes/docs/[...slug].astro', import.meta.url),
        });

        updateConfig({
          integrations: [mdx()],
          vite: {
            plugins: [lotusConfigPlugin(config), tailwindcss()],
          },
        });
      },
    },
  };
}

export { lotus };
export type {
  DocsSection,
  FooterSection,
  LotusThemeConfig,
  RadiusScale,
  ThemeAction,
  ThemeLink,
  ThemeMode,
} from './lib/theme';
