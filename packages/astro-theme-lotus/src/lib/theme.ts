import type { ThemeAccent } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

export type RadiusScale = 'none' | 'small' | 'medium' | 'large' | 'full';

export { accentScales } from './colors';
export type { AccentScale, ThemeAccent } from './colors';

export interface ThemeLink {
  label: string;
  href: string;
  external?: boolean;
}

export type ThemeNavbarVariant = 'soft' | 'outline' | 'solid';

export type ThemeNavbarColor = 'neutral' | 'accent';

export interface ThemeNavbarItem extends ThemeLink {
  icon?: string;
  trailingIcon?: string;
  variant?: ThemeNavbarVariant;
  color?: ThemeNavbarColor;
}

export interface ThemeSocialLink extends ThemeLink {
  icon: string;
}

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

export type PageActionType =
  | 'copy-page'
  | 'view-markdown'
  | 'open-chatgpt'
  | 'open-claude';

export interface PageActionConfig {
  type?: PageActionType | (string & {});
  label?: string;
  icon?: string;
  href?: string;
  external?: boolean;
}

export type OverrideComponentName =
  | 'HeaderNavbar'
  | 'HeaderSocialIcons'
  | 'PageActions'
  | 'PageHeader'
  | 'PageNavigation'
  | 'SearchDialog'
  | 'SiteBrand'
  | 'ThemeSwitch';

export type OverrideComponentsConfig = Partial<Record<OverrideComponentName, string>>;

export interface ThemeLogoConfig {
  light: string;
  dark: string;
  href?: string;
}

export type ThemeLogo = string | ThemeLogoConfig;

export interface LotusThemeConfig {
  name: string;
  description: string;
  logo: ThemeLogo;
  appearance: {
    accent: ThemeAccent;
    gray: 'slate' | 'zinc' | 'neutral' | 'stone';
    defaultMode: ThemeMode;
    radius: RadiusScale;
  };
  navbar: ThemeNavbarItem[];
  socials: ThemeSocialLink[];
  sidebars: SidebarConfig[];
  pageActions: PageActionConfig[];
  components?: OverrideComponentsConfig;
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
