import type { ThemeAccent } from './colors';
import type { LlmsOption } from './config';
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

export type SidebarBadgePosition = 'leading' | 'trailing';

export type SidebarBadgeVariant = 'solid' | 'soft' | 'subtle' | 'outline';

export type SidebarBadgeColor =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type SidebarBadge =
  | string
  | {
      label: string;
      position?: SidebarBadgePosition;
      variant?: SidebarBadgeVariant;
      color?: SidebarBadgeColor;
    };

export interface SidebarLinkItem {
  label: string;
  link: string;
  external?: boolean;
  icon?: string;
  badge?: SidebarBadge;
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
    depth?: number;
    exclude?: string | string[];
    structure?: 'flat' | 'tree';
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
  exclude?: string[];
  github?: string;
  branch?: string;
  max?: number;
  githubProfileLimit?: number;
}

export type ContributorsOption = boolean | ContributorsConfig;

export type OverrideComponentName =
  | 'Assistant'
  | 'FooterLinks'
  | 'HeaderNavbar'
  | 'HeaderSocialIcons'
  | 'PageActions'
  | 'PageAside'
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
  width?: number;
  height?: number;
  variant?: 'mark' | 'lockup';
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

export type SearchConfig =
  | false
  | {
      provider?: 'local';
    }
  | {
      provider: 'pagefind';
      excludeSelectors?: string[];
      outputSubdir?: string;
      rootSelector?: string;
    }
  | {
      provider: 'docsearch';
      appId: string;
      apiKey: string;
      indexName: string | Record<string, string>;
      askAi?: string;
      disableUserPersonalization?: boolean;
      insights?: boolean;
      maxResultsPerGroup?: number;
      searchParameters?: Record<string, unknown>;
      cssUrl?: string;
      jsUrl?: string;
    }
  | {
      provider: 'algolia';
      appId: string;
      apiKey: string;
      indexName: string | Record<string, string>;
    };

export type AssistantConfig =
  | false
  | {
      provider: 'inkeep';
      apiKey: string;
      organizationDisplayName?: string;
      primaryBrandColor?: string;
      integrationId?: string;
      organizationId?: string;
      scriptUrl?: string;
      baseSettings?: Record<string, unknown>;
      modalSettings?: Record<string, unknown>;
      searchSettings?: Record<string, unknown>;
      aiChatSettings?: Record<string, unknown>;
    }
  | {
      provider: 'kapa';
      websiteId: string;
      projectName?: string;
      projectColor?: string;
      projectLogo?: string;
      scriptUrl?: string;
      attributes?: Record<string, string | number | boolean | undefined>;
    }
  | {
      provider: 'custom';
    };

export interface ThemeSourceConfig {
  branch?: string;
  github?: string;
  gitlab?: string;
  codeberg?: string;
}

export interface EditLinkBaseConfig {
  branch?: string;
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
  logo?: ThemeLogo;
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
  search: SearchConfig;
  assistant: AssistantConfig;
  llms: LlmsOption;
  pageActions: PageActionConfig[];
  contributors?: ContributorsOption;
  components?: OverrideComponentsConfig;
  credits: boolean;
  docsBase: string;
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
