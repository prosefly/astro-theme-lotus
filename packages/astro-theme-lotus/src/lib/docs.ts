import { getCollection, type CollectionEntry } from 'astro:content';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import {
  getDefaultLocale,
  getLocalizedHref,
  getLocalizedSlugFromEntryId,
  getLocales,
  getLocaleByKey,
  getRouteSlugForLocalizedSlug,
  type NormalizedLocale,
} from './i18n';
import { warnSidebarIssues } from './sidebar/diagnostics';
import {
  getEntrySections,
  getSectionNavigation,
  getSidebarPagination,
  getSidebarSectionTitle,
} from './sidebar/indexes';
import { resolveSidebars } from './sidebar/resolve';
import type {
  DocsSectionNav,
  DocsSidebarNav,
  SidebarContentEntry,
} from './sidebar/types';
import type { LotusThemeConfig } from './theme';

export type {
  DocsNavItem,
  DocsPaginationItem,
  DocsPaginationNav,
  DocsSectionNav,
  DocsSidebarGroupNav,
  DocsSidebarItem,
  DocsSidebarNav,
} from './sidebar/types';

export {
  getSidebarPagination,
  getSidebarSectionTitle,
};

type DocsEntry = CollectionEntry<'docs'>;
const themeConfig = rawThemeConfig as LotusThemeConfig;
const emptySidebarNav: DocsSidebarNav = { links: [], groups: [] };

export interface DocsNavigationContext {
  locale: NormalizedLocale;
  entries: DocsEntry[];
  sections: DocsSectionNav[];
  sidebars: Record<string, DocsSidebarNav>;
  entrySections: Map<string, string>;
}

function getEntryOrder(entry: DocsEntry): number {
  return entry.data.sidebar?.order ?? entry.data.order ?? Number.MAX_SAFE_INTEGER;
}

function getLocale(localeKey?: string): NormalizedLocale {
  return getLocaleByKey(themeConfig, localeKey);
}

function getEntryInfo(entry: DocsEntry) {
  return getLocalizedSlugFromEntryId(themeConfig, entry.id, entry.data.slug);
}

function normalizeEntryId(entryId: string): string {
  return entryId.trim().replace(/^\/+|\/+$/g, '');
}

function isDocsEntry(entry: DocsEntry): boolean {
  const locales = getLocales(themeConfig);

  if (!themeConfig.locales || locales.some((locale) => !locale.directory)) {
    return true;
  }

  const entryId = normalizeEntryId(entry.id);

  return locales.some(
    (locale) =>
      entryId === locale.directory ||
      entryId.startsWith(`${locale.directory}/`),
  );
}

function entryToSidebarContentEntry(entry: DocsEntry): SidebarContentEntry {
  return {
    slug: getEntrySlug(entry),
    title: entry.data.sidebar?.label ?? entry.data.title,
    order: getEntryOrder(entry),
    hidden: entry.data.sidebar?.hidden ?? false,
  };
}

function entriesToSidebarContentEntries(entries: DocsEntry[]): SidebarContentEntry[] {
  return entries.map(entryToSidebarContentEntry);
}

export function getEntrySlug(entry: DocsEntry): string {
  return getEntryInfo(entry).slug;
}

export function getEntryLocale(entry: DocsEntry): NormalizedLocale {
  return getEntryInfo(entry).locale;
}

export function getEntryRouteSlug(entry: DocsEntry): string | undefined {
  return getRouteSlugForLocalizedSlug(getEntryInfo(entry));
}

export function getEntryMarkdownRouteSlug(entry: DocsEntry): string | undefined {
  return getRouteSlugForLocalizedSlug(getEntryInfo(entry), true);
}

export async function getDocsContext(
  currentSection?: string,
  localeKey?: string,
): Promise<DocsNavigationContext> {
  const locale = getLocale(localeKey);
  const entries = await getDocsEntries(locale.key);
  const resolved = resolveSidebars(
    themeConfig,
    entriesToSidebarContentEntries(entries),
    locale.key,
  );
  const entrySections = getEntrySections(resolved.sidebars, resolved.issues);

  warnSidebarIssues(resolved.issues, locale.key);

  return {
    locale,
    entries,
    sidebars: resolved.sidebars,
    entrySections,
    sections: getSectionNavigation(themeConfig, resolved.sidebars, currentSection, locale.key),
  };
}

export function getEntrySection(
  entry: DocsEntry,
  entries: DocsEntry[],
  localeKey = getEntryLocale(entry).key,
): string | undefined {
  const resolved = resolveSidebars(
    themeConfig,
    entriesToSidebarContentEntries(entries),
    localeKey,
  );
  const entrySections = getEntrySections(resolved.sidebars, resolved.issues);

  warnSidebarIssues(resolved.issues, localeKey);

  return entrySections.get(getEntrySlug(entry));
}

export async function getDocsEntries(localeKey?: string): Promise<DocsEntry[]> {
  const entries = await getCollection('docs');
  const docsEntries = entries.filter(isDocsEntry);
  const visibleEntries = import.meta.env.PROD
    ? docsEntries.filter((entry) => !entry.data.draft)
    : docsEntries;
  const locale = localeKey ? getLocale(localeKey) : undefined;
  let localizedEntries = visibleEntries;

  if (locale) {
    const defaultLocale = getDefaultLocale(themeConfig);
    const defaultEntries = visibleEntries.filter((entry) => getEntryLocale(entry).key === defaultLocale.key);
    const localeEntries = visibleEntries.filter((entry) => getEntryLocale(entry).key === locale.key);

    if (locale.key === defaultLocale.key) {
      localizedEntries = localeEntries;
    } else {
      const entriesBySlug = new Map(defaultEntries.map((entry) => [getEntrySlug(entry), entry]));

      for (const entry of localeEntries) {
        entriesBySlug.set(getEntrySlug(entry), entry);
      }

      localizedEntries = [...entriesBySlug.values()];
    }
  }

  return [...localizedEntries].sort((left, right) => {
    const orderDiff = getEntryOrder(left) - getEntryOrder(right);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return left.data.title.localeCompare(right.data.title);
  });
}

export function entryToHref(entry: DocsEntry): string {
  const { locale, slug } = getEntryInfo(entry);

  return getLocalizedHref(themeConfig, slug, locale.key);
}

export async function getDocsNavigation(
  currentSection?: string,
  localeKey?: string,
): Promise<DocsSectionNav[]> {
  return (await getDocsContext(currentSection, localeKey)).sections;
}

export async function getSidebarNavigation(
  currentSection?: string,
  localeKey?: string,
): Promise<DocsSidebarNav> {
  if (!currentSection) {
    return emptySidebarNav;
  }

  return (await getDocsContext(currentSection, localeKey)).sidebars[currentSection] ?? emptySidebarNav;
}

export function getEntrySectionFromContext(
  context: DocsNavigationContext,
  entry: DocsEntry,
): string | undefined {
  return context.entrySections.get(getEntrySlug(entry));
}
