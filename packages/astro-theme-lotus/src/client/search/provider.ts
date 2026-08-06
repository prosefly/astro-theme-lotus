import { createLocalSearchProvider } from './providers/local';
import { createPagefindSearchProvider } from './providers/pagefind';
import type { SearchProvider } from './types';

function createUnavailableProvider(): SearchProvider {
  return {
    async load() {
      throw new Error('Search provider is unavailable.');
    },

    async search() {
      throw new Error('Search provider is unavailable.');
    },
  };
}

export function createSearchProvider(dialog: Element): SearchProvider | undefined {
  const provider = dialog.getAttribute('data-search-provider') || 'local';

  if (provider === 'local') {
    const indexUrl = dialog.getAttribute('data-search-index');

    return indexUrl ? createLocalSearchProvider(indexUrl) : undefined;
  }

  if (provider === 'pagefind') {
    const bundlePath = dialog.getAttribute('data-pagefind-bundle');

    return bundlePath ? createPagefindSearchProvider(bundlePath) : undefined;
  }

  return createUnavailableProvider();
}
