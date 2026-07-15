export type ThemeMode = 'light' | 'dark' | 'system';

export type RadiusScale = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface ThemeLink {
  label: string;
  href: string;
  external?: boolean;
}

export type ThemeNavigationVariant = 'soft' | 'outline' | 'solid';

export type ThemeNavigationColor = 'neutral' | 'accent';

export interface ThemeNavigationItem extends ThemeLink {
  icon?: string;
  trailingIcon?: string;
  variant?: ThemeNavigationVariant;
  color?: ThemeNavigationColor;
}

export interface ThemeSocialLink extends ThemeLink {
  icon: string;
}

export type ThemeAction = ThemeNavigationItem;
export type ThemeActionVariant = ThemeNavigationVariant;
export type ThemeActionColor = ThemeNavigationColor;

export interface SidebarLinkItem {
  label: string;
  link: string;
  external?: boolean;
  icon?: string;
}

export interface SidebarGroupItem {
  label: string;
  icon?: string;
  collapsed?: boolean;
  items: SidebarItemConfig[];
}

export interface SidebarAutogenerateItem {
  autogenerate: {
    directory: string;
  };
}

export type SidebarItemConfig =
  | string
  | SidebarLinkItem
  | SidebarGroupItem
  | SidebarAutogenerateItem;

export interface SidebarConfig {
  slug?: string;
  label: string;
  icon?: string;
  items: SidebarItemConfig[];
}

export interface FooterSection {
  title: string;
  links: ThemeLink[];
}

export interface LotusThemeConfig {
  site: {
    title: string;
    description: string;
    logo: string;
  };
  appearance: {
    accent: string;
    gray: 'slate' | 'zinc' | 'neutral' | 'stone';
    fontSans: string;
    fontMono: string;
    defaultTheme: ThemeMode;
    radius: RadiusScale;
  };
  navigation: ThemeNavigationItem[];
  socials: ThemeSocialLink[];
  sidebars: SidebarConfig[];
  docsBase: string;
  iconify?: {
    apiBase?: string;
    preload?: string[];
    scan?: boolean;
  };
  footer: {
    copyright: string;
    sections: FooterSection[];
  };
}

export const DEFAULT_DOCS_BASE_PATH = '/docs';

export function normalizeDocsBasePath(
  basePath?: string,
  fallback = DEFAULT_DOCS_BASE_PATH,
): string {
  const input = basePath?.trim() || fallback;
  const normalized = `/${input}`.replace(/\/+/g, '/').replace(/\/$/, '');

  return normalized || '/';
}

export function getSectionForSlug(slug: string): string | undefined {
  if (!slug || slug === 'index') {
    return undefined;
  }

  const [section] = slug.split('/');
  return section || undefined;
}
