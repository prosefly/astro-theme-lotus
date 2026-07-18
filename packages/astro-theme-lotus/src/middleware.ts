import type { MiddlewareHandler } from 'astro';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import { normalizeDocsBasePath } from './lib/config';
import { getLocaleFromRouteSlug } from './lib/i18n';
import type { LotusThemeConfig } from './lib/theme';
import { useTranslations } from './lib/translations';

function getRouteSlug(pathname: string, docsBasePath: string): string {
  const normalizedPath = pathname.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');

  if (docsBasePath === '/') {
    return normalizedPath;
  }

  const normalizedDocsBase = docsBasePath.replace(/^\/+|\/+$/g, '');

  if (normalizedPath === normalizedDocsBase) {
    return '';
  }

  if (normalizedPath.startsWith(`${normalizedDocsBase}/`)) {
    return normalizedPath.slice(normalizedDocsBase.length + 1);
  }

  return normalizedPath;
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const themeConfig = rawThemeConfig as LotusThemeConfig;
  const docsBasePath = normalizeDocsBasePath(themeConfig.docsBase);
  const routeSlug = getRouteSlug(context.url.pathname, docsBasePath);
  const locale = getLocaleFromRouteSlug(themeConfig, routeSlug);
  const locals = context.locals;

  locals.t = useTranslations(themeConfig, locale);

  return next();
};
