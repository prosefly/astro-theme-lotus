import { getCollection, type CollectionEntry } from 'astro:content';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import {
  getDefaultLocale,
  getLocalizedHref,
  getLocalizedSlugFromEntryId,
  getLocales,
  getLocaleByKey,
  getRouteSlugForLocalizedSlug,
  localizeDocsHref,
  translateLabel,
  type NormalizedLocale,
} from './i18n';
import {
  type LotusThemeConfig,
  type SidebarAutogenerateItem,
  type SidebarConfig,
  type SidebarGroupItem,
  type SidebarItemConfig,
  type SidebarLinkItem,
} from './theme';

type DocsEntry = CollectionEntry<'docs'>;
const themeConfig = rawThemeConfig as LotusThemeConfig;

export interface DocsNavItem {
  title: string;
  href: string;
  slug: string;
  section?: string;
  order: number;
}

export interface DocsSidebarItem {
  label: string;
  href?: string;
  external?: boolean;
  icon?: string;
  slug?: string;
  items?: DocsSidebarItem[];
}

export interface DocsSidebarGroupNav {
  title: string;
  items: DocsSidebarItem[];
}

export interface DocsSidebarNav {
  links: DocsSidebarItem[];
  groups: DocsSidebarGroupNav[];
}

export interface DocsSectionNav {
  slug: string;
  label: string;
  icon?: string;
  href: string;
  active: boolean;
  items: DocsNavItem[];
}

export interface DocsPaginationItem {
  label: string;
  href: string;
  slug: string;
}

export interface DocsPaginationNav {
  previous?: DocsPaginationItem;
  next?: DocsPaginationItem;
}

export interface DocsNavigationContext {
  locale: NormalizedLocale;
  entries: DocsEntry[];
  sections: DocsSectionNav[];
  sidebars: Record<string, DocsSidebarNav>;
  entrySections: Map<string, string>;
}

type PaginationOverride = DocsEntry['data']['prev'];
const emptySidebarNav: DocsSidebarNav = { links: [], groups: [] };

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

function toNavItem(entry: DocsEntry, section: string | undefined, localeKey: string): DocsNavItem {
  const slug = getEntrySlug(entry);

  return {
    title: entry.data.sidebar?.label ?? entry.data.title,
    href: getLocalizedHref(themeConfig, slug, localeKey),
    slug,
    section,
    order: getEntryOrder(entry),
  };
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

function navItemToSidebarItem(item: DocsNavItem): DocsSidebarItem {
  return {
    label: item.title,
    href: item.href,
    slug: item.slug,
  };
}

function slugToTitle(slug: string): string {
  const segment = slug.split('/').filter(Boolean).at(-1) ?? slug;

  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugifyLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getSidebarSectionSlug(sidebar: SidebarConfig): string {
  return sidebar.slug ?? slugifyLabel(sidebar.label);
}

function slugToHref(slug: string, localeKey: string): string {
  return getLocalizedHref(themeConfig, slug, localeKey);
}

function isExternalLink(link: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('//');
}

function normalizeDirectory(directory: string): string {
  return directory.trim().replace(/^\/+|\/+$/g, '');
}

function isLinkItem(item: SidebarItemConfig): item is SidebarLinkItem {
  return typeof item === 'object' && item !== null && 'link' in item;
}

function isGroupItem(item: SidebarItemConfig): item is SidebarGroupItem {
  return typeof item === 'object' && item !== null && 'items' in item;
}

function isAutogenerateItem(item: SidebarItemConfig): item is SidebarAutogenerateItem {
  return typeof item === 'object' && item !== null && 'autogenerate' in item;
}

function getEntryMap(entries: DocsEntry[]): Map<string, DocsEntry> {
  return new Map(entries.map((entry) => [getEntrySlug(entry), entry]));
}

function getEntryForSlug(entriesBySlug: Map<string, DocsEntry>, slug: string): DocsEntry | undefined {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');

  return entriesBySlug.get(normalizedSlug || 'index');
}

function getAutogeneratedEntries(entries: DocsEntry[], directory: string): DocsEntry[] {
  const normalizedDirectory = normalizeDirectory(directory);

  return entries.filter((entry) => {
    const slug = getEntrySlug(entry);

    if (entry.data.sidebar?.hidden) {
      return false;
    }

    if (slug === 'index') {
      return false;
    }

    if (!normalizedDirectory) {
      return !slug.includes('/');
    }

    return slug.startsWith(`${normalizedDirectory}/`);
  });
}

function entryToSidebarItem(entry: DocsEntry, localeKey: string): DocsSidebarItem {
  const slug = getEntrySlug(entry);

  return {
    label: entry.data.sidebar?.label ?? entry.data.title,
    href: getLocalizedHref(themeConfig, slug, localeKey),
    slug,
  };
}

function slugToSidebarItem(
  entriesBySlug: Map<string, DocsEntry>,
  slug: string,
  localeKey: string,
): DocsSidebarItem {
  const entry = getEntryForSlug(entriesBySlug, slug);

  if (entry) {
    return entryToSidebarItem(entry, localeKey);
  }

  return {
    label: slugToTitle(slug),
    href: slugToHref(slug, localeKey),
    slug,
  };
}

function linkToSidebarItem(item: SidebarLinkItem, localeKey: string): DocsSidebarItem {
  const external = item.external ?? isExternalLink(item.link);

  return {
    label: translateLabel(item.label, item.translations, localeKey),
    href: external ? item.link : localizeDocsHref(themeConfig, item.link, localeKey),
    external,
    icon: item.icon,
  };
}

function normalizeSidebarItems(
  items: SidebarItemConfig[],
  entries: DocsEntry[],
  entriesBySlug: Map<string, DocsEntry>,
  localeKey: string,
): DocsSidebarItem[] {
  return items.flatMap((item) => {
    if (typeof item === 'string') {
      return [slugToSidebarItem(entriesBySlug, item, localeKey)];
    }

    if (isAutogenerateItem(item)) {
      return sortNavItems(
        getAutogeneratedEntries(entries, item.autogenerate.directory).map((entry) =>
          toNavItem(entry, undefined, localeKey),
        ),
      ).map(navItemToSidebarItem);
    }

    if (isGroupItem(item)) {
      return [
        {
          label: translateLabel(item.label, item.translations, localeKey),
          icon: item.icon,
          items: normalizeSidebarItems(item.items, entries, entriesBySlug, localeKey),
        },
      ];
    }

    if (isLinkItem(item)) {
      return [linkToSidebarItem(item, localeKey)];
    }

    return [];
  });
}

function sidebarConfigToNav(
  sidebar: SidebarConfig,
  entries: DocsEntry[],
  localeKey: string,
): DocsSidebarNav {
  const entriesBySlug = getEntryMap(entries);
  const links: DocsSidebarItem[] = [];
  const groups: DocsSidebarGroupNav[] = [];

  for (const item of sidebar.items) {
    if (isGroupItem(item)) {
      groups.push({
        title: translateLabel(item.label, item.translations, localeKey),
        items: normalizeSidebarItems(item.items, entries, entriesBySlug, localeKey),
      });
    } else {
      links.push(...normalizeSidebarItems([item], entries, entriesBySlug, localeKey));
    }
  }

  return { links, groups };
}

function findItemSectionTitle(
  items: DocsSidebarItem[],
  currentSlug: string,
  sectionTitle: string,
): string | undefined {
  for (const item of items) {
    if (item.slug === currentSlug) {
      return sectionTitle;
    }

    if (item.items) {
      const childTitle = findItemSectionTitle(item.items, currentSlug, sectionTitle);

      if (childTitle) {
        return childTitle;
      }
    }
  }

  return undefined;
}

export function getSidebarSectionTitle(
  sidebar: DocsSidebarNav,
  currentSlug: string,
): string | undefined {
  for (const group of sidebar.groups) {
    const title = findItemSectionTitle(group.items, currentSlug, group.title);

    if (title) {
      return title;
    }
  }

  const linkTitle = findItemSectionTitle(sidebar.links, currentSlug, '');

  return linkTitle || undefined;
}

function flattenSidebarPaginationItems(items: DocsSidebarItem[]): DocsPaginationItem[] {
  return items.flatMap((item) => {
    const childItems = item.items ? flattenSidebarPaginationItems(item.items) : [];

    if (item.slug && item.href && !item.external) {
      return [
        {
          label: item.label,
          href: item.href,
          slug: item.slug,
        },
        ...childItems,
      ];
    }

    return childItems;
  });
}

export function getSidebarPagination(
  sidebar: DocsSidebarNav,
  currentSlug: string,
  overrides: { previous?: PaginationOverride; next?: PaginationOverride } = {},
): DocsPaginationNav {
  const items = [
    ...flattenSidebarPaginationItems(sidebar.links),
    ...sidebar.groups.flatMap((group) => flattenSidebarPaginationItems(group.items)),
  ];
  const currentIndex = items.findIndex((item) => item.slug === currentSlug);

  if (currentIndex === -1) {
    return {};
  }

  return {
    previous: resolvePaginationItem(items[currentIndex - 1], overrides.previous),
    next: resolvePaginationItem(items[currentIndex + 1], overrides.next),
  };
}

function resolvePaginationItem(
  generatedItem: DocsPaginationItem | undefined,
  override: PaginationOverride,
): DocsPaginationItem | undefined {
  if (override === false) {
    return undefined;
  }

  if (typeof override === 'string') {
    return generatedItem ? { ...generatedItem, label: override } : undefined;
  }

  if (override && typeof override === 'object') {
    const href = override.link ?? generatedItem?.href;
    const label = override.label ?? generatedItem?.label;

    if (!href || !label) {
      return undefined;
    }

    return {
      href,
      label,
      slug: generatedItem?.slug ?? href,
    };
  }

  return generatedItem;
}

function getSidebarContentItems(
  sidebar: SidebarConfig,
  entries: DocsEntry[],
  localeKey: string,
): DocsPaginationItem[] {
  const sidebarNav = sidebarConfigToNav(sidebar, entries, localeKey);

  return getSidebarNavContentItems(sidebarNav);
}

function getSidebarNavContentItems(sidebarNav: DocsSidebarNav): DocsPaginationItem[] {
  return [
    ...flattenSidebarPaginationItems(sidebarNav.links),
    ...sidebarNav.groups.flatMap((group) => flattenSidebarPaginationItems(group.items)),
  ];
}

function getEntrySectionFromMap(
  entrySections: Map<string, string>,
  entry: DocsEntry,
): string | undefined {
  return entrySections.get(getEntrySlug(entry));
}

function getEntrySections(sidebars: Record<string, DocsSidebarNav>): Map<string, string> {
  const entrySections = new Map<string, string>();

  for (const [sectionSlug, sidebarNav] of Object.entries(sidebars)) {
    for (const item of getSidebarNavContentItems(sidebarNav)) {
      if (!entrySections.has(item.slug)) {
        entrySections.set(item.slug, sectionSlug);
      }
    }
  }

  return entrySections;
}

function getSectionNavigation(
  sidebars: Record<string, DocsSidebarNav>,
  currentSection: string | undefined,
  localeKey: string,
): DocsSectionNav[] {
  return themeConfig.sidebars.map((sidebar) => {
    const sectionSlug = getSidebarSectionSlug(sidebar);
    const sidebarNav = sidebars[sectionSlug] ?? emptySidebarNav;
    const items = getSidebarNavContentItems(sidebarNav).map((item, index) => ({
      title: item.label,
      href: item.href,
      slug: item.slug,
      section: sectionSlug,
      order: index,
    }));
    const href =
      items[0]?.href ??
      getLocalizedHref(themeConfig, sectionSlug, localeKey);

    return {
      slug: sectionSlug,
      label: translateLabel(sidebar.label, sidebar.translations, localeKey),
      icon: sidebar.icon,
      href,
      active: sectionSlug === currentSection,
      items,
    };
  });
}

export async function getDocsContext(
  currentSection?: string,
  localeKey?: string,
): Promise<DocsNavigationContext> {
  const locale = getLocale(localeKey);
  const entries = await getDocsEntries(locale.key);
  const sidebars = Object.fromEntries(
    themeConfig.sidebars.map((sidebar) => {
      const sectionSlug = getSidebarSectionSlug(sidebar);

      return [sectionSlug, sidebarConfigToNav(sidebar, entries, locale.key)];
    }),
  );
  const entrySections = getEntrySections(sidebars);

  return {
    locale,
    entries,
    sidebars,
    entrySections,
    sections: getSectionNavigation(sidebars, currentSection, locale.key),
  };
}

export function getEntrySection(
  entry: DocsEntry,
  entries: DocsEntry[],
  localeKey = getEntryLocale(entry).key,
): string | undefined {
  for (const sidebar of themeConfig.sidebars) {
    const sectionSlug = getSidebarSectionSlug(sidebar);
    const items = getSidebarContentItems(sidebar, entries, localeKey);

    if (items.some((item) => item.slug === getEntrySlug(entry))) {
      return sectionSlug;
    }
  }

  return undefined;
}

function sortNavItems(items: DocsNavItem[]): DocsNavItem[] {
  return [...items].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.title.localeCompare(right.title);
  });
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
  return getEntrySectionFromMap(context.entrySections, entry);
}
