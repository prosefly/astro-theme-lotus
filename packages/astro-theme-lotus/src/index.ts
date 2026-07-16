import mdx from '@astrojs/mdx';
import proseflyIcon from '@prosefly/astro-components/icon';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import type { AstroIntegration } from 'astro';
import {
  defineLotusConfig,
  lotusConfigPlugin,
  resolveExpressiveCodeOptions,
  resolveLotusConfig,
  resolveMarkdownConfig,
  type LotusIntegrationOptions,
} from './lib/config';
import { accentScales } from './lib/colors';
import { componentOverridePlugin } from './lib/overriding';
import { getIconPreloadNames } from './lib/preload-icons';
import { normalizeDocsBasePath } from './lib/theme';

export default function lotus(options: LotusIntegrationOptions = {}): AstroIntegration {
  const config = resolveLotusConfig(options);
  const expressiveCodeOptions = resolveExpressiveCodeOptions(options.expressiveCode);
  const docsBasePath = normalizeDocsBasePath(config.docsBase);
  const docsPattern =
    docsBasePath === '/'
      ? '/[...slug]'
      : `${docsBasePath}/[...slug]`;
  const markdownPattern =
    docsBasePath === '/'
      ? '/[...slug].md'
      : `${docsBasePath}/[...slug].md`;
  const searchPattern =
    docsBasePath === '/'
      ? '/search.json'
      : `${docsBasePath}/search.json`;

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, injectRoute, updateConfig }) => {
        injectRoute({
          pattern: docsPattern,
          entrypoint: new URL('./routes/docs.astro', import.meta.url),
        });
        injectRoute({
          pattern: markdownPattern,
          entrypoint: new URL('./routes/docs.md.ts', import.meta.url),
        });
        injectRoute({
          pattern: searchPattern,
          entrypoint: new URL('./routes/search.json.ts', import.meta.url),
        });

        updateConfig({
          markdown: resolveMarkdownConfig(options, astroConfig.markdown),
          integrations: [
            ...(expressiveCodeOptions === false
              ? []
              : [astroExpressiveCode(expressiveCodeOptions)]),
            mdx(),
            proseflyIcon({
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

export { accentScales, defineLotusConfig, lotus };
export type {
  LotusIntegrationOptions,
} from './lib/config';
export type {
  AccentScale,
  FooterSection,
  LotusThemeConfig,
  OverrideComponentName,
  OverrideComponentsConfig,
  PageActionConfig,
  PageActionType,
  RadiusScale,
  SidebarAutogenerateItem,
  SidebarConfig,
  SidebarGroupItem,
  SidebarItemConfig,
  SidebarLinkItem,
  ThemeLink,
  ThemeLogo,
  ThemeLogoConfig,
  ThemeAccent,
  ThemeMode,
  ThemeNavbarColor,
  ThemeNavbarItem,
  ThemeNavbarVariant,
  ThemeSocialLink,
} from './lib/theme';
