import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import astroExpressiveCode from 'astro-expressive-code';
import type { AstroIntegration } from 'astro';
import { getDefaultComponentsIntegration } from './lib/config/components-integration';
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
  type LotusIntegrationOptions,
} from './lib/config/index';
import { componentOverridePlugin } from './lib/overriding';
import { getLotusInjectedRoutes } from './lib/routes';
import { buildPagefindIndex } from './lib/search/pagefind';
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
        const fileOptions = loadLotusConfigFile(astroConfig.root, addWatchFile);
        const mergedOptions = normalizeLegacyLotusConfigOptions(
          mergeLotusConfigOptions(fileOptions, options),
          (message) => logger.warn(message),
        );
        const expressiveCodeOptions = resolveExpressiveCodeOptions(
          mergedOptions.markdown?.expressiveCode,
        );
        const defaultComponentsIntegration = getDefaultComponentsIntegration(
          astroConfig.integrations,
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
            ...(defaultComponentsIntegration ? [defaultComponentsIntegration] : []),
            ...(expressiveCodeOptions === false
              ? []
              : [astroExpressiveCode(expressiveCodeOptions)]),
            mdx(),
            ...(preparedOpenApi.integration ? [preparedOpenApi.integration] : []),
          ],
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
