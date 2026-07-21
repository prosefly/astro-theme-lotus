import mdx from '@astrojs/mdx';
import proseflyIcon from '@prosefly/astro-components/icon';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import type { AstroIntegration } from 'astro';
import {
  defineLotusConfig,
  loadLotusConfigFile,
  lotusConfigPlugin,
  mergeLotusConfigOptions,
  resolveAsyncLotusConfig,
  resolveExpressiveCodeOptions,
  resolveLocalAssetConfig,
  resolveLotusConfig,
  resolveMarkdownConfig,
  type LotusIntegrationOptions,
} from './lib/config/index';
import { componentOverridePlugin } from './lib/overriding';
import { getLotusInjectedRoutes } from './lib/routes';
import { buildPagefindIndex } from './lib/search/pagefind';
import { getIconPreloadNames } from './lib/preload-icons';
import { lotusStylesPlugin } from './lib/styles';

export default function lotus(options: LotusIntegrationOptions = {}): AstroIntegration {
  let config = resolveLotusConfig(options);

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': async ({
        addMiddleware,
        config: astroConfig,
        injectRoute,
        updateConfig,
      }) => {
        const fileOptions = loadLotusConfigFile(astroConfig.root);
        const mergedOptions = mergeLotusConfigOptions(fileOptions, options);
        const expressiveCodeOptions = resolveExpressiveCodeOptions(
          mergedOptions.markdown?.expressiveCode,
        );

        config = resolveLotusConfig(mergedOptions);
        config = resolveLocalAssetConfig(config, astroConfig.publicDir);
        config = await resolveAsyncLotusConfig(config);

        for (const route of getLotusInjectedRoutes(config)) {
          injectRoute(route);
        }

        addMiddleware({
          order: 'pre',
          entrypoint: new URL('./middleware.ts', import.meta.url),
        });

        updateConfig({
          markdown: resolveMarkdownConfig(mergedOptions, astroConfig.markdown),
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

export { defineLotusConfig, lotus };
export type {
  LotusIntegrationOptions,
  LotusMarkdownOptions,
} from './lib/config/index';
export type {
  FooterSection,
  LocaleConfig,
  LotusThemeConfig,
  OverrideComponentName,
  OverrideComponentsConfig,
  PageActionConfig,
  RadiusScale,
  SearchConfig,
  SidebarConfig,
  SidebarItemConfig,
  ThemeAccent,
  ThemeLogo,
  ThemeLogoConfig,
  ThemeMode,
  ThemeModeControl,
  ThemeNavbarItem,
  ThemeSocialLink,
} from './lib/theme';
export type {
  NormalizedLocale,
} from './lib/i18n';
