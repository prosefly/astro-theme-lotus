import type { ThemeAccent } from './colors';
import type { UiTranslations } from './translations';

export type ThemeMode = 'light' | 'dark' | 'system';

export type RadiusScale = 'none' | 'small' | 'medium' | 'large' | 'full';

export { accentScales } from './colors';
export type { AccentScale, ThemeAccent } from './colors';

export interface ThemeLink {
  label: string;
  href: string;
  external?: boolean;
  translations?: Record<string, string>;
}

export type ThemeNavbarVariant = 'text' | 'soft' | 'outline' | 'solid';

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
  translations?: Record<string, string>;
}

export interface SidebarGroupItem {
  label: string;
  icon?: string;
  collapsed?: boolean;
  translations?: Record<string, string>;
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
  translations?: Record<string, string>;
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

export interface ContributorInfo {
  name: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  profileUrl?: string;
  commits: number;
  lastCommit?: string;
}

export interface ContributorsConfig {
  avatar?: 'github' | 'gravatar' | false;
  contentRoot?: string;
  exclude?: string[];
  github?: string;
  branch?: string;
  max?: number;
}

export type ContributorsOption = boolean | ContributorsConfig;

export type OverrideComponentName =
  | 'HeaderNavbar'
  | 'HeaderSocialIcons'
  | 'PageActions'
  | 'PageHeader'
  | 'PageMeta'
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

export interface ThemeFaviconLink {
  href: string;
  rel?: string;
  type?: string;
  sizes?: string;
  media?: string;
  color?: string;
}

export type ThemeFavicon = string | ThemeFaviconLink | ThemeFaviconLink[];

export interface LocaleConfig {
  label: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  directory?: string;
}

export interface ThemeSourceConfig {
  branch?: string;
  contentRoot?: string;
  github?: string;
  gitlab?: string;
  codeberg?: string;
}

export interface EditLinkBaseConfig {
  branch?: string;
  contentRoot?: string;
}

export interface EditLinkPatternConfig extends EditLinkBaseConfig {
  pattern: string;
}

export interface EditLinkGithubConfig extends EditLinkBaseConfig {
  github: string;
}

export interface EditLinkGitlabConfig extends EditLinkBaseConfig {
  gitlab: string;
}

export interface EditLinkCodebergConfig extends EditLinkBaseConfig {
  codeberg: string;
}

export type EditLinkConfig =
  | EditLinkPatternConfig
  | EditLinkGithubConfig
  | EditLinkGitlabConfig
  | EditLinkCodebergConfig;

export interface LotusThemeConfig {
  name: string;
  description: string;
  logo: ThemeLogo;
  favicon?: ThemeFavicon;
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
  contributors?: ContributorsOption;
  components?: OverrideComponentsConfig;
  docsBase: string;
  homepage?: boolean;
  source?: ThemeSourceConfig;
  editLink?: boolean | EditLinkConfig;
  defaultLocale?: string;
  locales?: Record<string, LocaleConfig>;
  ui?: Record<string, Partial<UiTranslations>>;
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
