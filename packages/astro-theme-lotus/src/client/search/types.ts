export interface SearchResult {
  title?: string;
  description?: string;
  excerpt?: string;
  section?: string;
  group?: string;
  href?: string;
}

export interface SearchProvider {
  load(): Promise<void>;
  search(query: string): Promise<SearchResult[]>;
}
