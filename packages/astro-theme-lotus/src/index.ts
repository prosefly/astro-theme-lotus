import mdx from '@astrojs/mdx';
import proseflyIcons from '@prosefly/astro-components/icons';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import { componentOverridePlugin } from './lib/overriding';
import { getIconPreloadNames } from './lib/preload-icons';
import {
  DEFAULT_DOCS_BASE_PATH,
  normalizeDocsBasePath,
  type FooterSection,
  type LotusThemeConfig,
  type OverrideComponentsConfig,
  type SidebarConfig,
  type ThemeNavigationItem,
  type ThemeSocialLink,
} from './lib/theme';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export interface LotusIntegrationOptions {
  site?: Partial<LotusThemeConfig['site']>;
  appearance?: Partial<LotusThemeConfig['appearance']>;
  navigation?: ThemeNavigationItem[];
  socials?: ThemeSocialLink[];
  sidebars?: SidebarConfig[];
  components?: OverrideComponentsConfig;
  docsBase?: string;
  iconify?: Partial<NonNullable<LotusThemeConfig['iconify']>>;
  footer?: {
    copyright?: string;
    sections?: FooterSection[];
  };
}

const defaultConfig: LotusThemeConfig = {
  site: {
    title: 'Prosefly Lotus',
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
  navigation: [{ label: 'Docs', href: '/docs/' }],
  socials: [],
  sidebars: [],
  components: {},
  docsBase: DEFAULT_DOCS_BASE_PATH,
  iconify: {
    apiBase: 'https://api.iconify.design',
    preload: [],
    scan: true,
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
    docsBase: normalizeDocsBasePath(options.docsBase, defaultConfig.docsBase),
    iconify: {
      ...defaultConfig.iconify,
      ...options.iconify,
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
  const docsBasePath = normalizeDocsBasePath(config.docsBase);
  const docsPattern =
    docsBasePath === '/'
      ? '/[...slug]'
      : `${docsBasePath}/[...slug]`;

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, injectRoute, updateConfig }) => {
        injectRoute({
          pattern: docsPattern,
          entrypoint: new URL('./routes/docs/[...slug].astro', import.meta.url),
        });

        updateConfig({
          integrations: [
            mdx(),
            proseflyIcons({
              apiBase: config.iconify?.apiBase,
              preload: getIconPreloadNames(config),
              scan: config.iconify?.scan,
            }),
          ],
          vite: {
            plugins: [
              lotusConfigPlugin(config),
              componentOverridePlugin(config.components ?? {}, astroConfig.root),
              tailwindcss(),
            ],
          },
        });
      },
    },
  };
}

export { lotus };
export type {
  FooterSection,
  LotusThemeConfig,
  OverrideComponentName,
  OverrideComponentsConfig,
  RadiusScale,
  SidebarAutogenerateItem,
  SidebarConfig,
  SidebarGroupItem,
  SidebarItemConfig,
  SidebarLinkItem,
  ThemeAction,
  ThemeActionColor,
  ThemeActionVariant,
  ThemeLink,
  ThemeMode,
  ThemeNavigationColor,
  ThemeNavigationItem,
  ThemeNavigationVariant,
  ThemeSocialLink,
} from './lib/theme';
