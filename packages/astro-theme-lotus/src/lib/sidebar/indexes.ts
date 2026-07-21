import { getLocalizedHref, translateLabel } from '../i18n';
import type { LotusThemeConfig } from '../theme';
import { getSidebarSectionSlug } from './resolve';
import type {
  DocsNavItem,
  DocsPaginationItem,
  DocsPaginationNav,
  DocsSectionNav,
  DocsSidebarItem,
  DocsSidebarNav,
  SidebarIssue,
} from './types';

type PaginationOverride =
  | false
  | true
  | string
  | {
    label?: string;
    link?: string;
  }
  | undefined;

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

export function getSidebarNavContentItems(sidebarNav: DocsSidebarNav): DocsPaginationItem[] {
  return [
    ...flattenSidebarPaginationItems(sidebarNav.links),
    ...sidebarNav.groups.flatMap((group) => flattenSidebarPaginationItems(group.items)),
  ];
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

export function getSidebarPagination(
  sidebar: DocsSidebarNav,
  currentSlug: string,
  overrides: { previous?: PaginationOverride; next?: PaginationOverride } = {},
): DocsPaginationNav {
  const items = getSidebarNavContentItems(sidebar);
  const currentIndex = items.findIndex((item) => item.slug === currentSlug);

  if (currentIndex === -1) {
    return {};
  }

  return {
    previous: resolvePaginationItem(items[currentIndex - 1], overrides.previous),
    next: resolvePaginationItem(items[currentIndex + 1], overrides.next),
  };
}

export function getEntrySections(
  sidebars: Record<string, DocsSidebarNav>,
  issues: SidebarIssue[],
): Map<string, string> {
  const entrySections = new Map<string, string>();

  for (const [sectionSlug, sidebarNav] of Object.entries(sidebars)) {
    for (const item of getSidebarNavContentItems(sidebarNav)) {
      if (!entrySections.has(item.slug)) {
        entrySections.set(item.slug, sectionSlug);
        continue;
      }

      issues.push({
        type: 'duplicate-entry',
        slug: item.slug,
        firstSection: entrySections.get(item.slug) ?? '',
        duplicateSection: sectionSlug,
      });
    }
  }

  return entrySections;
}

export function getSectionNavigation(
  config: LotusThemeConfig,
  sidebars: Record<string, DocsSidebarNav>,
  currentSection: string | undefined,
  localeKey: string,
): DocsSectionNav[] {
  return config.docsNav.map((sidebar) => {
    const sectionSlug = getSidebarSectionSlug(sidebar);
    const sidebarNav = sidebars[sectionSlug] ?? { links: [], groups: [] };
    const items: DocsNavItem[] = getSidebarNavContentItems(sidebarNav).map((item, index) => ({
      title: item.label,
      href: item.href,
      slug: item.slug,
      section: sectionSlug,
      order: index,
    }));
    const href =
      items[0]?.href ??
      getLocalizedHref(config, sectionSlug, localeKey);

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
