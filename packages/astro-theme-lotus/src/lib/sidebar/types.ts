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

export interface SidebarContentEntry {
  slug: string;
  title: string;
  order: number;
  hidden: boolean;
}

export type SidebarIssue =
  | {
    type: 'duplicate-section';
    sectionSlug: string;
    labels: string[];
  }
  | {
    type: 'missing-entry';
    sectionSlug: string;
    slug: string;
  }
  | {
    type: 'empty-autogenerate';
    sectionSlug: string;
    directory: string;
  }
  | {
    type: 'duplicate-entry';
    slug: string;
    firstSection: string;
    duplicateSection: string;
  };

export interface ResolvedSidebars {
  sidebars: Record<string, DocsSidebarNav>;
  issues: SidebarIssue[];
}
