import type { SearchProvider, SearchResult } from '../types';

interface PagefindSearchResult {
  results: Array<{
    data(): Promise<PagefindResultData>;
  }>;
}

interface PagefindResultData {
  url?: string;
  excerpt?: string;
  plain_excerpt?: string;
  meta?: {
    title?: string;
  };
  sub_results?: Array<{
    title?: string;
    url?: string;
    excerpt?: string;
    plain_excerpt?: string;
  }>;
}

interface PagefindApi {
  init(): Promise<void> | void;
  preload?(query: string): Promise<void> | void;
  search(query: string): Promise<PagefindSearchResult>;
}

function toSearchResult(data: PagefindResultData): SearchResult {
  const subResult = data.sub_results?.[0];

  return {
    title: subResult?.title ?? data.meta?.title,
    excerpt: subResult?.plain_excerpt ?? data.plain_excerpt ?? subResult?.excerpt ?? data.excerpt,
    href: subResult?.url ?? data.url,
  };
}

export function createPagefindSearchProvider(bundlePath: string): SearchProvider {
  let pagefind: PagefindApi | undefined;
  let loadingPagefind: Promise<PagefindApi> | undefined;

  async function loadPagefind(): Promise<PagefindApi> {
    loadingPagefind ??= import(/* @vite-ignore */ bundlePath)
      .then(async (module) => {
        const api = module as PagefindApi;

        await api.init();

        return api;
      });

    pagefind = await loadingPagefind;

    return pagefind;
  }

  return {
    async load() {
      await loadPagefind();
    },

    async search(query: string): Promise<SearchResult[]> {
      const api = pagefind ?? await loadPagefind();
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return [];
      }

      await api.preload?.(trimmedQuery);

      const response = await api.search(trimmedQuery);
      const resultData = await Promise.all(
        response.results.slice(0, 8).map((result) => result.data()),
      );

      return resultData.map(toSearchResult);
    },
  };
}
