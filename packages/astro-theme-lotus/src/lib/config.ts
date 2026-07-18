import { isUnifiedProcessor, unified } from '@astrojs/markdown-remark';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { rehypeImageGallery, remarkPackageManagerTabs } from '@prosefly/astro-components/markdown';
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
import { rehypeHeadingAnchors } from './heading-anchors';
import { readPublicImageDimensions } from './image-size';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export interface LotusIntegrationOptions {
  name?: LotusThemeConfig['name'];
  description?: LotusThemeConfig['description'];
  logo?: LotusThemeConfig['logo'];
  favicon?: LotusThemeConfig['favicon'];
  appearance?: Partial<LotusThemeConfig['appearance']>;
  navbar?: ThemeNavbarItem[];
  socials?: ThemeSocialLink[];
  sidebars?: SidebarConfig[];
  search?: LotusThemeConfig['search'];
  assistant?: LotusThemeConfig['assistant'];
  pageActions?: PageActionConfig[];
  contributors?: LotusThemeConfig['contributors'];
  components?: OverrideComponentsConfig;
  credits?: LotusThemeConfig['credits'];
  docsBase?: string;
  source?: LotusThemeConfig['source'];
  editLink?: LotusThemeConfig['editLink'];
  defaultLocale?: LotusThemeConfig['defaultLocale'];
  locales?: LotusThemeConfig['locales'];
  ui?: LotusThemeConfig['ui'];
  iconify?: Partial<NonNullable<LotusThemeConfig['iconify']>>;
  expressiveCode?: false | AstroExpressiveCodeOptions;
  packageManagerTabs?: false;
  footer?: {
    copyright?: string;
    sections?: FooterSection[];
  };
}

const defaultConfig: LotusThemeConfig = {
  name: 'Documentation',
  description: 'Project documentation.',
  favicon: undefined,
  appearance: {
    accent: 'indigo',
    gray: 'neutral',
    defaultMode: 'system',
    radius: 'medium',
  },
  navbar: [{ label: 'Docs', href: '/' }],
  socials: [],
  sidebars: [],
  search: { provider: 'local' },
  assistant: false,
  pageActions: [
    { type: 'copy-page', icon: 'lucide:copy' },
    { type: 'view-markdown', icon: 'lucide:file-text' },
    { type: 'open-chatgpt', icon: 'simple-icons:openai' },
    { type: 'open-claude', icon: 'simple-icons:claude' },
  ],
  contributors: false,
  components: {},
  credits: true,
  docsBase: DEFAULT_DOCS_BASE_PATH,
  source: undefined,
  editLink: undefined,
  defaultLocale: undefined,
  locales: undefined,
  ui: undefined,
  iconify: {
    apiBase: 'https://api.iconify.design',
    preload: [],
    scan: true,
  },
  footer: {
    copyright: '',
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

export function resolveLocalAssetConfig(
  config: LotusThemeConfig,
  publicDir: URL,
): LotusThemeConfig {
  if (!config.logo || typeof config.logo === 'string') {
    return config;
  }

  if (config.logo.width && config.logo.height) {
    return config;
  }

  const dimensions =
    readPublicImageDimensions(config.logo.light, publicDir)
    ?? readPublicImageDimensions(config.logo.dark, publicDir);
  if (!dimensions) {
    return config;
  }

  return {
    ...config,
    logo: {
      ...config.logo,
      width: config.logo.width ?? dimensions.width,
      height: config.logo.height ?? dimensions.height,
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
  const rehypePlugins = [
    ...(unifiedOptions?.rehypePlugins ?? markdownConfig?.rehypePlugins ?? []),
    rehypeImageGallery,
    rehypeHeadingAnchors,
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
      rehypePlugins,
      remarkRehype: unifiedOptions?.remarkRehype ?? markdownConfig?.remarkRehype,
      gfm: unifiedOptions?.gfm ?? markdownConfig?.gfm,
      smartypants: unifiedOptions?.smartypants ?? markdownConfig?.smartypants,
    }),
  };
}

function createInlineSvgUrl(svgContents: string[]): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svgContents.join(''))}")`;
}

const lucideCopyIcon = createInlineSvgUrl([
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`,
  `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>`,
  `<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
  `</svg>`,
]);

const defaultExpressiveCodeOptions: AstroExpressiveCodeOptions = {
  themes: ['github-light', 'github-dark'],
  plugins: [pluginLineNumbers()],
  defaultProps: {
    showLineNumbers: false,
  },
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
    frames: {
      copyIcon: lucideCopyIcon,
    },
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
