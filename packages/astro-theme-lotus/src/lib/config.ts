import type { Plugin } from 'vite';
import {
  DEFAULT_DOCS_BASE_PATH,
  normalizeDocsBasePath,
  type FooterSection,
  type LotusThemeConfig,
  type OverrideComponentsConfig,
  type PageActionConfig,
  type SidebarConfig,
  type ThemeNavbarItem,
  type ThemeSocialLink,
} from './theme';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export interface LotusIntegrationOptions {
  site?: Partial<LotusThemeConfig['site']>;
  appearance?: Partial<LotusThemeConfig['appearance']>;
  navbar?: ThemeNavbarItem[];
  socials?: ThemeSocialLink[];
  sidebars?: SidebarConfig[];
  pageActions?: PageActionConfig[];
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
    gray: 'neutral',
    fontSans: 'Inter',
    fontMono: 'JetBrains Mono',
    defaultTheme: 'system',
    radius: 'medium',
  },
  navbar: [{ label: 'Docs', href: '/docs/' }],
  socials: [],
  sidebars: [],
  pageActions: [
    { type: 'copy-page', label: 'Copy page', icon: 'lucide:copy' },
    { type: 'view-markdown', label: 'View as Markdown', icon: 'lucide:file-text' },
    { type: 'open-chatgpt', label: 'Open in ChatGPT', icon: 'simple-icons:openai' },
    { type: 'open-claude', label: 'Open in Claude', icon: 'simple-icons:claude' },
  ],
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

export function resolveLotusConfig(options: LotusIntegrationOptions): LotusThemeConfig {
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
    pageActions: options.pageActions ?? defaultConfig.pageActions,
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

export function lotusConfigPlugin(config: LotusThemeConfig): Plugin {
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
