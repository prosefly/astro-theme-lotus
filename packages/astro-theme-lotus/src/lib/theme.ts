export type ThemeMode = 'light' | 'dark' | 'system';

export type RadiusScale = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface ThemeLink {
  label: string;
  href: string;
  external?: boolean;
}

export type ThemeActionVariant = 'soft' | 'outline' | 'solid';

export type ThemeActionColor = 'neutral' | 'accent';

export interface ThemeAction extends ThemeLink {
  icon?: 'github' | 'x' | 'bluesky' | 'discord' | 'external';
  variant?: ThemeActionVariant;
  color?: ThemeActionColor;
}

export interface DocsSection {
  slug: string;
  label: string;
  order?: number;
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
  nav: ThemeLink[];
  actions: ThemeAction[];
  socials: ThemeAction[];
  docs: {
    basePath?: string;
    sections: DocsSection[];
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

export function sortDocsSections(sections: DocsSection[]): DocsSection[] {
  return [...sections].sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.label.localeCompare(right.label);
  });
}

export function getSectionForSlug(slug: string): string | undefined {
  if (!slug || slug === 'index') {
    return undefined;
  }

  const [section] = slug.split('/');
  return section || undefined;
}
