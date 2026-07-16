import { isUnifiedProcessor, unified } from '@astrojs/markdown-remark';
import { remarkPackageManagerTabs } from '@prosefly/astro-components/package-manager-tabs';
import { mergeEcConfigOptions, type AstroExpressiveCodeOptions } from 'astro-expressive-code';
import type { AstroConfig } from 'astro';
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
  expressiveCode?: false | AstroExpressiveCodeOptions;
  packageManagerTabs?: false;
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
  const {
    expressiveCode: _expressiveCode,
    packageManagerTabs: _packageManagerTabs,
    ...themeOptions
  } = options;

  return {
    ...defaultConfig,
    ...themeOptions,
    site: {
      ...defaultConfig.site,
      ...themeOptions.site,
    },
    appearance: {
      ...defaultConfig.appearance,
      ...themeOptions.appearance,
    },
    pageActions: themeOptions.pageActions ?? defaultConfig.pageActions,
    docsBase: normalizeDocsBasePath(themeOptions.docsBase, defaultConfig.docsBase),
    iconify: {
      ...defaultConfig.iconify,
      ...themeOptions.iconify,
    },
    footer: {
      ...defaultConfig.footer,
      ...themeOptions.footer,
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

export function resolveMarkdownConfig(
  options: LotusIntegrationOptions,
  markdownConfig: AstroConfig['markdown'],
) {
  const expressiveCodeOptions = resolveExpressiveCodeOptions(options.expressiveCode);
  const markdownProcessor = markdownConfig?.processor;
  const unifiedOptions =
    markdownProcessor && isUnifiedProcessor(markdownProcessor)
      ? markdownProcessor.options
      : undefined;
  const remarkPlugins = [
    ...(unifiedOptions?.remarkPlugins ?? markdownConfig?.remarkPlugins ?? []),
    ...(options.packageManagerTabs === false ? [] : [remarkPackageManagerTabs]),
  ];

  return {
    ...(expressiveCodeOptions === false
      ? {
          shikiConfig: {
            themes: {
              light: 'github-light',
              dark: 'github-dark',
            },
          },
        }
      : {}),
    processor: unified({
      remarkPlugins,
      rehypePlugins: unifiedOptions?.rehypePlugins ?? markdownConfig?.rehypePlugins,
      remarkRehype: unifiedOptions?.remarkRehype ?? markdownConfig?.remarkRehype,
      gfm: unifiedOptions?.gfm ?? markdownConfig?.gfm,
      smartypants: unifiedOptions?.smartypants ?? markdownConfig?.smartypants,
    }),
  };
}

const defaultExpressiveCodeOptions: AstroExpressiveCodeOptions = {
  themes: ['github-light', 'github-dark'],
  useDarkModeMediaQuery: true,
  customizeTheme: (theme) => {
    theme.name = theme.type === 'dark' ? 'dark' : 'light';
  },
  useThemedScrollbars: false,
  styleOverrides: {
    borderRadius: 'var(--lotus-radius-lg)',
    borderWidth: '1px',
    borderColor: 'var(--lotus-code-border)',
    codeBackground: 'var(--lotus-code-background)',
    codeForeground: 'var(--lotus-text)',
    codeFontFamily: 'var(--lotus-font-mono)',
    codeFontSize: '0.875rem',
    codeLineHeight: '1.7142857',
    uiFontFamily: 'var(--lotus-font-sans)',
    uiFontSize: '0.8125rem',
    focusBorder: 'var(--lotus-accent)',
    scrollbarThumbColor: 'color-mix(in oklab, var(--lotus-text-muted) 70%, transparent)',
    scrollbarThumbHoverColor: 'var(--lotus-text-muted)',
  },
};

export function resolveExpressiveCodeOptions(
  options: LotusIntegrationOptions['expressiveCode'],
): AstroExpressiveCodeOptions | false {
  if (options === false) {
    return false;
  }

  return mergeEcConfigOptions(defaultExpressiveCodeOptions, options ?? {});
}
