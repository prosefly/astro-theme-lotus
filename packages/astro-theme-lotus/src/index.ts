import mdx from '@astrojs/mdx';
import proseflyIcon from '@prosefly/astro-components/icon';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import type { AstroIntegration } from 'astro';
import {
  defineLotusConfig,
  lotusConfigPlugin,
  resolveExpressiveCodeOptions,
  resolveLocalAssetConfig,
  resolveLotusConfig,
  resolveMarkdownConfig,
  type LotusIntegrationOptions,
} from './lib/config/index';
import { accentScales } from './lib/colors';
import { componentOverridePlugin } from './lib/overriding';
import { getLotusInjectedRoutes } from './lib/routes';
import { buildPagefindIndex } from './lib/search/pagefind';
import { getIconPreloadNames } from './lib/preload-icons';
import { lotusStylesPlugin } from './lib/styles';

export default function lotus(options: LotusIntegrationOptions = {}): AstroIntegration {
  let config = resolveLotusConfig(options);
  const expressiveCodeOptions = resolveExpressiveCodeOptions(options.expressiveCode);

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({
        addMiddleware,
        config: astroConfig,
        injectRoute,
        updateConfig,
      }) => {
        config = resolveLocalAssetConfig(config, astroConfig.publicDir);

        for (const route of getLotusInjectedRoutes(config)) {
          injectRoute(route);
        }

        addMiddleware({
          order: 'pre',
          entrypoint: new URL('./middleware.ts', import.meta.url),
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
              lotusStylesPlugin(astroConfig.root, astroConfig.srcDir),
              tailwindcss(),
            ],
          },
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        await buildPagefindIndex(config, dir, logger);
      },
    },
  };
}

export { accentScales, defineLotusConfig, lotus };
export type {
  LotusIntegrationOptions,
} from './lib/config/index';
export type {
  AccentScale,
  EditLinkBaseConfig,
  EditLinkCodebergConfig,
  EditLinkConfig,
  EditLinkGithubConfig,
  EditLinkGitlabConfig,
  EditLinkPatternConfig,
  FooterSection,
  LocaleConfig,
  LotusThemeConfig,
  OverrideComponentName,
  OverrideComponentsConfig,
  PageActionConfig,
  PageActionType,
  RadiusScale,
  SearchConfig,
  SidebarAutogenerateItem,
  SidebarBadge,
  SidebarBadgeColor,
  SidebarBadgePosition,
  SidebarBadgeVariant,
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
export type {
  LocalizedSlug,
  NormalizedLocale,
} from './lib/i18n';
export type {
  LotusTranslate,
  TranslationValues,
  UiTranslationKey,
  UiTranslations,
} from './lib/translations';
