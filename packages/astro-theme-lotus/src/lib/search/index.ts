import type { LotusThemeConfig } from '../theme';

export type PagefindSearchConfig = Extract<LotusThemeConfig['search'], { provider: 'pagefind' }>;

export function getPagefindOutputSubdir(config: PagefindSearchConfig): string {
  return config.outputSubdir?.replace(/^\/+|\/+$/g, '') || 'pagefind';
}
