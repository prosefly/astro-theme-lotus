import type { LotusThemeConfig } from './theme';

export const ROOT_LOCALE = 'root';

export interface NormalizedLocale {
  key: string;
  label: string;
  lang: string;
  dir: 'ltr' | 'rtl';
  directory: string;
  pathPrefix: string;
}

export interface LocalizedSlug {
  locale: NormalizedLocale;
  slug: string;
}

function normalizePathSegment(value: string | undefined): string {
  return value?.trim().replace(/^\/+|\/+$/g, '') ?? '';
}

function createDefaultRootLocale(): NormalizedLocale {
  return {
    key: ROOT_LOCALE,
    label: 'English',
    lang: 'en',
    dir: 'ltr',
    directory: '',
    pathPrefix: '',
  };
}

export function getLocales(config: LotusThemeConfig): NormalizedLocale[] {
  const locales = config.locales;

  if (!locales || Object.keys(locales).length === 0) {
    return [createDefaultRootLocale()];
  }

  return Object.entries(locales).map(([key, locale]) => {
    const directory = normalizePathSegment(
      locale.directory ?? (key === ROOT_LOCALE ? '' : key),
    );

    return {
      key,
      label: locale.label,
      lang: locale.lang ?? (key === ROOT_LOCALE ? locale.label : key),
      dir: locale.dir ?? 'ltr',
      directory,
      pathPrefix: key === ROOT_LOCALE ? '' : normalizePathSegment(key),
    };
  });
}

export function getDefaultLocale(config: LotusThemeConfig): NormalizedLocale {
  const locales = getLocales(config);
  const defaultLocaleKey = config.defaultLocale ?? (
    locales.some((locale) => locale.key === ROOT_LOCALE) ? ROOT_LOCALE : locales[0]?.key
  );

  return locales.find((locale) => locale.key === defaultLocaleKey) ?? locales[0] ?? createDefaultRootLocale();
}

export function getLocaleByKey(
  config: LotusThemeConfig,
  localeKey: string | undefined,
): NormalizedLocale {
  const locales = getLocales(config);
  const defaultLocale = getDefaultLocale(config);

  if (!localeKey) {
    return defaultLocale;
  }

  return locales.find((locale) => locale.key === localeKey) ?? defaultLocale;
}

export function getLocaleFromRouteSlug(
  config: LotusThemeConfig,
  routeSlug: string | undefined,
): NormalizedLocale {
  const normalizedRouteSlug = normalizePathSegment(routeSlug);
  const [firstSegment] = normalizedRouteSlug.split('/');

  return (
    getLocales(config).find((locale) => locale.pathPrefix && locale.pathPrefix === firstSegment) ??
    getDefaultLocale(config)
  );
}

export function getLocalizedSlugFromEntryId(
  config: LotusThemeConfig,
  entryId: string,
  slugOverride?: string,
): LocalizedSlug {
  const normalizedEntryId = normalizePathSegment(entryId) || 'index';
  const locales = getLocales(config).sort((left, right) => right.directory.length - left.directory.length);

  for (const locale of locales) {
    if (!locale.directory) {
      continue;
    }

    if (normalizedEntryId === locale.directory || normalizedEntryId.startsWith(`${locale.directory}/`)) {
      const slug = normalizedEntryId === locale.directory
        ? 'index'
        : normalizedEntryId.slice(locale.directory.length + 1);

      return {
        locale,
        slug: normalizePathSegment(slugOverride) || slug || 'index',
      };
    }
  }

  const defaultLocale = getDefaultLocale(config);

  return {
    locale: defaultLocale,
    slug: normalizePathSegment(slugOverride) || normalizedEntryId,
  };
}

export function getRouteSlugForLocalizedSlug(
  localizedSlug: LocalizedSlug,
  markdown = false,
): string | undefined {
  const { locale, slug } = localizedSlug;
  const normalizedSlug = normalizePathSegment(slug) || 'index';
  const routeSlug = [
    locale.pathPrefix,
    normalizedSlug === 'index' ? '' : normalizedSlug,
  ].filter(Boolean).join('/');

  if (markdown) {
    return routeSlug ? `${routeSlug}.md` : 'index.md';
  }

  return routeSlug || undefined;
}

export function getLocalizedHref(
  config: LotusThemeConfig,
  slug: string | undefined,
  localeKey?: string,
): string {
  const locale = getLocaleByKey(config, localeKey);
  const normalizedSlug = normalizePathSegment(slug) || 'index';
  const routeSlug = [
    locale.pathPrefix,
    normalizedSlug === 'index' ? '' : normalizedSlug,
  ].filter(Boolean).join('/');
  const basePath = config.docsBase === '/' ? '' : config.docsBase.replace(/\/$/, '');

  return routeSlug ? `${basePath}/${routeSlug}/` : `${basePath || '/'}`;
}

export function getLocalizedMarkdownHref(
  config: LotusThemeConfig,
  slug: string | undefined,
  localeKey?: string,
): string {
  const locale = getLocaleByKey(config, localeKey);
  const normalizedSlug = normalizePathSegment(slug) || 'index';
  const routeSlug = [
    locale.pathPrefix,
    normalizedSlug === 'index' ? 'index' : normalizedSlug,
  ].filter(Boolean).join('/');
  const basePath = config.docsBase === '/' ? '' : config.docsBase.replace(/\/$/, '');

  return `${basePath}/${routeSlug}.md`;
}

export function getLocalizedSearchHref(config: LotusThemeConfig, localeKey?: string): string {
  const locale = getLocaleByKey(config, localeKey);
  const basePath = config.docsBase === '/' ? '' : config.docsBase.replace(/\/$/, '');
  const routeSlug = [locale.pathPrefix, 'search.json'].filter(Boolean).join('/');

  return `${basePath}/${routeSlug}`;
}

export function localizeDocsHref(
  config: LotusThemeConfig,
  href: string,
  localeKey?: string,
): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) {
    return href;
  }

  const docsBase = config.docsBase === '/' ? '' : config.docsBase.replace(/\/$/, '');
  const docsRoot = docsBase ? `${docsBase}/` : '/';

  if (docsBase && href !== docsBase && !href.startsWith(docsRoot)) {
    return href;
  }

  const withoutBase = docsBase
    ? href.slice(docsBase.length)
    : href;
  let slug = withoutBase.replace(/^\/+|\/+$/g, '');
  const locale = getLocaleByKey(config, localeKey);

  for (const candidate of getLocales(config)) {
    if (candidate.pathPrefix && (slug === candidate.pathPrefix || slug.startsWith(`${candidate.pathPrefix}/`))) {
      slug = slug === candidate.pathPrefix ? 'index' : slug.slice(candidate.pathPrefix.length + 1);
      break;
    }
  }

  return getLocalizedHref(config, slug || 'index', locale.key);
}

export function translateLabel(
  label: string,
  translations: Record<string, string> | undefined,
  localeKey: string,
): string {
  return translations?.[localeKey] ?? label;
}
