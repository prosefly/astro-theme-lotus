import { normalizeDocsBasePath } from './config/resolve';
import { getLocales } from './i18n';
import type { LotusThemeConfig } from './theme';

export interface LotusInjectedRoute {
  pattern: string;
  entrypoint: URL;
}

function getDocsRoutePattern(docsBasePath: string, suffix: string): string {
  return docsBasePath === '/'
    ? suffix
    : `${docsBasePath}${suffix}`;
}

function isLocalSearchEnabled(config: LotusThemeConfig): boolean {
  if (config.search === false) {
    return false;
  }

  return (config.search.provider ?? 'local') === 'local';
}

function hasLocalizedRoutes(config: LotusThemeConfig): boolean {
  return getLocales(config).some((locale) => Boolean(locale.pathPrefix));
}

export function getLotusInjectedRoutes(config: LotusThemeConfig): LotusInjectedRoute[] {
  const docsBasePath = normalizeDocsBasePath(config.docsBase);
  const routes: LotusInjectedRoute[] = [
    {
      pattern: '/404',
      entrypoint: new URL('../routes/404.astro', import.meta.url),
    },
    {
      pattern: '/llms.txt',
      entrypoint: new URL('../routes/llms.txt.ts', import.meta.url),
    },
    {
      pattern: getDocsRoutePattern(docsBasePath, '/[...slug]'),
      entrypoint: new URL('../routes/docs.astro', import.meta.url),
    },
    {
      pattern: getDocsRoutePattern(docsBasePath, '/[...slug].md'),
      entrypoint: new URL('../routes/docs.md.ts', import.meta.url),
    },
  ];

  if (isLocalSearchEnabled(config)) {
    routes.push({
      pattern: getDocsRoutePattern(docsBasePath, '/search.json'),
      entrypoint: new URL('../routes/search.json.ts', import.meta.url),
    });

    if (hasLocalizedRoutes(config)) {
      routes.push({
        pattern: getDocsRoutePattern(docsBasePath, '/[locale]/search.json'),
        entrypoint: new URL('../routes/search.json.ts', import.meta.url),
      });
    }
  }

  return routes;
}
