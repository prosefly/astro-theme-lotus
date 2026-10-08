import {
  getDefaultLocale,
  getLocalizedHref,
  getLocalizedSlugFromEntryId,
} from '../i18n';
import type { LotusThemeConfig } from '../theme';
import type { HeadConfig } from './head';

interface SeoEntry {
  id: string;
  data: { slug?: string };
}

export interface LanguageAlternate {
  lang: string;
  href: string;
}

export function getDocsLanguageAlternates(
  config: LotusThemeConfig,
  entries: SeoEntry[],
): Map<string, LanguageAlternate[]> {
  const alternatesByEntry = new Map<string, LanguageAlternate[]>();

  if (!config.locales || Object.keys(config.locales).length === 0) {
    return alternatesByEntry;
  }

  const translations = new Map<string, SeoEntry[]>();
  const defaultLocale = getDefaultLocale(config);

  for (const entry of entries) {
    // The content path identifies translations even when their public slugs differ.
    const { slug } = getLocalizedSlugFromEntryId(config, entry.id);
    const group = translations.get(slug) ?? [];
    group.push(entry);
    translations.set(slug, group);
  }

  for (const group of translations.values()) {
    const alternates: LanguageAlternate[] = [];
    let defaultHref: string | undefined;

    for (const entry of group) {
      const { locale, slug } = getLocalizedSlugFromEntryId(config, entry.id, entry.data.slug);
      const href = getLocalizedHref(config, slug, locale.key);
      alternates.push({ lang: locale.lang, href });

      if (locale.key === defaultLocale.key) {
        defaultHref = href;
      }
    }

    if (defaultHref) {
      alternates.push({ lang: 'x-default', href: defaultHref });
    }

    for (const entry of group) {
      alternatesByEntry.set(entry.id, alternates);
    }
  }

  return alternatesByEntry;
}

export function createLanguageAlternateHead(
  alternates: LanguageAlternate[],
  site: URL | undefined,
  pathname: string,
): HeadConfig {
  if (!site) {
    return [];
  }

  return alternates.map(({ lang, href }) => ({
    tag: 'link',
    attrs: {
      rel: 'alternate',
      hreflang: lang,
      href: getSeoUrl(href, site, pathname),
    },
  }));
}

export function getSeoUrl(href: string, site: URL, pathname: string): string {
  const url = new URL(href, site);
  url.search = '';
  url.hash = '';

  if (pathname.endsWith('/')) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/`;
  } else if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/$/, '');
  }

  return url.href;
}

export function createOpenGraphHead(head: HeadConfig): HeadConfig {
  const title = head.find((entry) => entry.tag === 'title')?.content;
  const description = head.find(
    (entry) => entry.tag === 'meta' && entry.attrs?.name === 'description',
  )?.attrs?.content;
  const canonicalUrl = head.find(
    (entry) => entry.tag === 'link' && entry.attrs?.rel === 'canonical',
  )?.attrs?.href;

  return [
    { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
    ...(title ? [{ tag: 'meta', attrs: { property: 'og:title', content: title } }] : []),
    ...(description ? [{ tag: 'meta', attrs: { property: 'og:description', content: description } }] : []),
    ...(canonicalUrl ? [{ tag: 'meta', attrs: { property: 'og:url', content: canonicalUrl } }] : []),
  ];
}
