import type { LotusThemeConfig } from '../theme';

export type PagefindSearchConfig = Extract<LotusThemeConfig['search'], { provider: 'pagefind' }>;

export function isPagefindSearchEnabled(config: LotusThemeConfig): boolean {
  return config.search !== false && config.search.provider === 'pagefind';
}

export function getPagefindSearchConfig(config: LotusThemeConfig): PagefindSearchConfig | undefined {
  return isPagefindSearchEnabled(config) ? config.search as PagefindSearchConfig : undefined;
}

export function getPagefindOutputSubdir(config: PagefindSearchConfig): string {
  return config.outputSubdir?.replace(/^\/+|\/+$/g, '') || 'pagefind';
}
