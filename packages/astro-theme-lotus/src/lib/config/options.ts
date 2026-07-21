import type { AstroExpressiveCodeOptions } from 'astro-expressive-code';
import type {
  FooterSection,
  LotusThemeConfig,
  OverrideComponentsConfig,
  PageActionConfig,
  DocsNavConfig,
  SiteNavItem,
  ThemeSocialLink,
} from '../theme';

export interface LotusMarkdownOptions {
  expressiveCode?: false | AstroExpressiveCodeOptions;
  calloutDirectives?: false;
  cjkFriendly?: boolean | 'auto';
  packageManagerTabs?: false;
  imageGallery?: false;
}

export interface LotusIntegrationOptions {
  name?: LotusThemeConfig['name'];
  description?: LotusThemeConfig['description'];
  logo?: LotusThemeConfig['logo'];
  favicon?: LotusThemeConfig['favicon'];
  appearance?: Partial<LotusThemeConfig['appearance']>;
  siteNav?: SiteNavItem[];
  /** @deprecated Use `siteNav` instead. */
  navbar?: SiteNavItem[];
  socials?: ThemeSocialLink[];
  themeModeControl?: LotusThemeConfig['themeModeControl'];
  docsNav?: DocsNavConfig[];
  /** @deprecated Use `docsNav` instead. */
  sidebars?: DocsNavConfig[];
  search?: LotusThemeConfig['search'];
  assistant?: LotusThemeConfig['assistant'];
  llms?: LotusThemeConfig['llms'];
  pageActions?: PageActionConfig[];
  contributors?: LotusThemeConfig['contributors'];
  components?: OverrideComponentsConfig;
  credits?: LotusThemeConfig['credits'];
  docsBase?: string;
  source?: LotusThemeConfig['source'];
  editLink?: LotusThemeConfig['editLink'];
  defaultLocale?: LotusThemeConfig['defaultLocale'];
  locales?: LotusThemeConfig['locales'];
  ui?: LotusThemeConfig['ui'];
  iconify?: Partial<NonNullable<LotusThemeConfig['iconify']>>;
  markdown?: LotusMarkdownOptions;
  footer?: {
    copyright?: string;
    sections?: FooterSection[];
  };
}

export function defineLotusConfig(config: LotusIntegrationOptions): LotusIntegrationOptions {
  return config;
}
