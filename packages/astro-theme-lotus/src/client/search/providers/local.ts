import type { SearchProvider, SearchResult } from '../types';

interface LocalSearchResult extends SearchResult {
  content?: string;
}

interface ScoredSearchResult {
  item: LocalSearchResult;
  score: number;
}

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(item: LocalSearchResult, tokens: string[]): number {
  const title = item.title?.toLowerCase() ?? '';
  const description = item.description?.toLowerCase() ?? '';
  const section = item.section?.toLowerCase() ?? '';
  const group = item.group?.toLowerCase() ?? '';
  const content = item.content?.toLowerCase() ?? '';
  const searchable = `${title} ${description} ${section} ${group} ${content}`;
  let score = 0;

  for (const token of tokens) {
    if (!searchable.includes(token)) {
      return 0;
    }

    if (title === token) score += 80;
    if (title.startsWith(token)) score += 40;
    if (title.includes(token)) score += 30;
    if (description.includes(token)) score += 14;
    if (section.includes(token) || group.includes(token)) score += 10;
    if (content.includes(token)) score += 4;
  }

  return score;
}

export function createLocalSearchProvider(indexUrl: string): SearchProvider {
  let searchIndex: LocalSearchResult[] | undefined;
  let loadingIndex: Promise<LocalSearchResult[]> | undefined;

  async function loadIndex(): Promise<LocalSearchResult[]> {
    if (searchIndex) {
      return searchIndex;
    }

    loadingIndex ??= fetch(indexUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Search index request failed: ${response.status}`);
        }

        return response.json();
      })
      .then((data): LocalSearchResult[] => {
        const items = Array.isArray(data.items) ? data.items : [];
        searchIndex = items;

        return items;
      });

    return loadingIndex;
  }

  return {
    async load() {
      await loadIndex();
    },

    async search(query: string): Promise<SearchResult[]> {
      const tokens = tokenize(query);

      if (!tokens.length) {
        return [];
      }

      const items = await loadIndex();

      return items
        .map((item): ScoredSearchResult => ({ item, score: scoreItem(item, tokens) }))
        .filter((result) => result.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 8)
        .map((result) => result.item);
    },
  };
}
