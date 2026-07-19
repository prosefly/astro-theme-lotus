import type { AstroExpressiveCodeOptions } from 'astro-expressive-code';
import type {
  FooterSection,
  LotusThemeConfig,
  OverrideComponentsConfig,
  PageActionConfig,
  SidebarConfig,
  ThemeNavbarItem,
  ThemeSocialLink,
} from '../theme';

export interface LotusMarkdownOptions {
  expressiveCode?: false | AstroExpressiveCodeOptions;
  calloutDirectives?: false;
  packageManagerTabs?: false;
  imageGallery?: false;
}

export interface LotusIntegrationOptions {
  name?: LotusThemeConfig['name'];
  description?: LotusThemeConfig['description'];
  logo?: LotusThemeConfig['logo'];
  favicon?: LotusThemeConfig['favicon'];
  appearance?: Partial<LotusThemeConfig['appearance']>;
  navbar?: ThemeNavbarItem[];
  socials?: ThemeSocialLink[];
  themeModeControl?: LotusThemeConfig['themeModeControl'];
  sidebars?: SidebarConfig[];
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
