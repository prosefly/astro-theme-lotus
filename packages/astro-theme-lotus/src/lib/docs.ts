import { getCollection, type CollectionEntry } from 'astro:content';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import type { LotusThemeConfig } from './theme';
import { sortDocsSections } from './theme';

type DocsEntry = CollectionEntry<'docs'>;
const themeConfig = rawThemeConfig as LotusThemeConfig;

export interface DocsNavItem {
  title: string;
  href: string;
  slug: string;
  section?: string;
  order: number;
}

export interface DocsSectionNav {
  slug: string;
  label: string;
  href: string;
  active: boolean;
  items: DocsNavItem[];
}

function getEntryOrder(entry: DocsEntry): number {
  return entry.data.order ?? Number.MAX_SAFE_INTEGER;
}

function getEntrySection(entry: DocsEntry): string | undefined {
  if (entry.id === 'index') {
    return entry.data.section;
  }

  return entry.data.section ?? entry.id.split('/')[0];
}

function toNavItem(entry: DocsEntry): DocsNavItem {
  return {
    title: entry.data.title,
    href: entryToHref(entry),
    slug: entry.id,
    section: getEntrySection(entry),
    order: getEntryOrder(entry),
  };
}

function sortNavItems(items: DocsNavItem[]): DocsNavItem[] {
  return [...items].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.title.localeCompare(right.title);
  });
}

export async function getDocsEntries(): Promise<DocsEntry[]> {
  const entries = await getCollection('docs');

  return [...entries].sort((left, right) => {
    const orderDiff = getEntryOrder(left) - getEntryOrder(right);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return left.data.title.localeCompare(right.data.title);
  });
}

export function entryToHref(entry: DocsEntry): string {
  if (entry.id === 'index') {
    return '/docs/';
  }

  return `/docs/${entry.id}/`;
}

export function getCurrentSection(slug: string | undefined): string | undefined {
  if (!slug || slug === 'index') {
    return undefined;
  }

  const [section] = slug.split('/');
  return section || undefined;
}

export async function getDocsNavigation(
  currentSlug?: string,
): Promise<DocsSectionNav[]> {
  const entries = await getDocsEntries();
  const itemsBySection = new Map<string, DocsNavItem[]>();

  for (const entry of entries) {
    const item = toNavItem(entry);

    if (!item.section) {
      continue;
    }

    const sectionItems = itemsBySection.get(item.section) ?? [];
    sectionItems.push(item);
    itemsBySection.set(item.section, sectionItems);
  }

  const currentSection = getCurrentSection(currentSlug);

  return sortDocsSections(themeConfig.docs.sections).map((section) => {
    const items = sortNavItems(itemsBySection.get(section.slug) ?? []);
    const href = items[0]?.href ?? `/docs/${section.slug}/`;

    return {
      slug: section.slug,
      label: section.label,
      href,
      active: section.slug === currentSection,
      items,
    };
  });
}

export async function getSidebarItems(
  currentSlug?: string,
): Promise<DocsNavItem[]> {
  const currentSection = getCurrentSection(currentSlug);

  if (!currentSection) {
    return [];
  }

  const entries = await getDocsEntries();

  return sortNavItems(
    entries
      .map(toNavItem)
      .filter((item) => item.section === currentSection),
  );
}
