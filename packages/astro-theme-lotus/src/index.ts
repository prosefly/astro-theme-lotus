import mdx from '@astrojs/mdx';
import proseflyComponents from '@prosefly/astro-components/integration';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import type { AstroIntegration } from 'astro';
import {
  defineLotusConfig,
  loadLotusConfigFile,
  lotusConfigPlugin,
  mergeLotusConfigOptions,
  normalizeLegacyLotusConfigOptions,
  resolveAsyncLotusConfig,
  resolveExpressiveCodeOptions,
  resolveLocalAssetConfig,
  resolveLotusConfig,
  resolveMarkdownConfig,
  resolveMarkdownExtensions,
  type LotusIntegrationOptions,
} from './lib/config/index';
import { componentOverridePlugin } from './lib/overriding';
import { getLotusInjectedRoutes } from './lib/routes';
import { buildPagefindIndex } from './lib/search/pagefind';
import { getIconPreloadNames } from './lib/preload-icons';
import { getOpenApiInjectedRoutes, prepareOpenApi } from './lib/openapi/setup';
import { emptyOpenApiManifest, openApiManifestPlugin } from './lib/openapi/virtual';
import { lotusStylesPlugin } from './lib/styles';

export default function lotus(options: LotusIntegrationOptions = {}): AstroIntegration {
  let config = resolveLotusConfig(normalizeLegacyLotusConfigOptions(options));
  let openApiManifest = emptyOpenApiManifest;

  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': async ({
        addMiddleware,
        addWatchFile,
        config: astroConfig,
        injectRoute,
        logger,
        updateConfig,
      }) => {
        const fileOptions = loadLotusConfigFile(astroConfig.root);
        const mergedOptions = normalizeLegacyLotusConfigOptions(
          mergeLotusConfigOptions(fileOptions, options),
          (message) => logger.warn(message),
        );
        const expressiveCodeOptions = resolveExpressiveCodeOptions(
          mergedOptions.markdown?.expressiveCode,
        );

        config = resolveLotusConfig(mergedOptions);
        config = resolveLocalAssetConfig(config, astroConfig.publicDir);
        config = await resolveAsyncLotusConfig(config);
        const preparedOpenApi = await prepareOpenApi(config, astroConfig.root, { addWatchFile });

        config = preparedOpenApi.config;
        openApiManifest = preparedOpenApi.manifest;

        for (const route of getLotusInjectedRoutes(config)) {
          injectRoute(route);
        }
        for (const route of getOpenApiInjectedRoutes(openApiManifest)) {
          injectRoute(route);
        }

        addMiddleware({
          order: 'pre',
          entrypoint: new URL('./middleware.ts', import.meta.url),
        });

        const configUpdate = {
          markdown: resolveMarkdownConfig(mergedOptions, astroConfig.markdown),
          integrations: [
            proseflyComponents({
              icons: {
                apiBase: config.iconify?.apiBase,
                preload: getIconPreloadNames(config),
                scan: config.iconify?.scan,
              },
              markdown: {
                calloutDirectives: mergedOptions.markdown?.calloutDirectives,
                packageManagerTabs: mergedOptions.markdown?.packageManagerTabs,
                imageGallery: mergedOptions.markdown?.imageGallery,
                ...resolveMarkdownExtensions(mergedOptions, astroConfig.markdown),
              },
            }),
            ...(expressiveCodeOptions === false
              ? []
              : [astroExpressiveCode(expressiveCodeOptions)]),
            mdx(),
            ...(preparedOpenApi.integration ? [preparedOpenApi.integration] : []),
          ],
          ...(expressiveCodeOptions === false
            ? {
                markdown: {
                  shikiConfig: {
                    themes: { light: 'github-light', dark: 'github-dark' },
                  },
                },
              }
            : {}),
          vite: {
            plugins: [
              lotusConfigPlugin(config),
              openApiManifestPlugin(openApiManifest),
              componentOverridePlugin(config.components ?? {}, astroConfig.root),
              lotusStylesPlugin(astroConfig.root, astroConfig.srcDir, config.head),
              tailwindcss(),
            ],
          },
        } as Parameters<typeof updateConfig>[0];

        updateConfig(configUpdate);
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
  DocsNavConfig,
  FooterSection,
  LocaleConfig,
  LotusThemeConfig,
  OpenApiConfig,
  OpenApiGroupBy,
  OpenApiIntegrationConfig,
  OpenApiOperationGroupInput,
  OpenApiSchemaBudgetOptions,
  OpenApiSourceConfig,
  OverrideComponentName,
  OverrideComponentsConfig,
  PageActionConfig,
  RadiusScale,
  SearchConfig,
  SidebarItemConfig,
  SidebarOpenApiItem,
  SidebarOpenApiOptions,
  SiteNavItem,
  ThemeAccent,
  ThemeLogo,
  ThemeLogoConfig,
  ThemeMode,
  ThemeModeControl,
  ThemeSocialLink,
} from './lib/theme';
export type {
  NormalizedLocale,
} from './lib/i18n';
export type {
  HeadConfig,
  HeadConfigEntry,
} from './lib/page/head';
