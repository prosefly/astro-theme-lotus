import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import {
  DEFAULT_DOCS_BASE_PATH,
  normalizeDocsBasePath,
  type DocsSection,
  type FooterSection,
  type LotusThemeConfig,
  type ThemeAction,
  type ThemeLink,
} from './lib/theme';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export interface LotusIntegrationOptions {
  site?: Partial<LotusThemeConfig['site']>;
  appearance?: Partial<LotusThemeConfig['appearance']>;
  nav?: ThemeLink[];
  actions?: ThemeAction[];
  socials?: ThemeAction[];
  docs?: {
    basePath?: string;
    sections?: DocsSection[];
  };
  footer?: {
    copyright?: string;
    sections?: FooterSection[];
  };
}

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
  socials: [],
  docs: {
    basePath: DEFAULT_DOCS_BASE_PATH,
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
      basePath: normalizeDocsBasePath(
        options.docs?.basePath,
        defaultConfig.docs.basePath,
      ),
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
  const docsBasePath = normalizeDocsBasePath(config.docs.basePath);
  const docsPattern =
    docsBasePath === '/'
      ? '/[...slug]'
      : `${docsBasePath}/[...slug]`;

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        injectRoute({
          pattern: docsPattern,
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
  ThemeActionColor,
  ThemeActionVariant,
  ThemeLink,
  ThemeMode,
} from './lib/theme';
