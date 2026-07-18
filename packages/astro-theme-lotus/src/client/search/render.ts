import type { SearchResult } from './types';

export function createSearchMessageElement(message: string): HTMLElement {
  const empty = document.createElement('div');
  empty.className = 'px-3 py-8 text-center text-sm text-(--lotus-text-muted)';
  empty.textContent = message;

  return empty;
}

export function createSearchResultElement(
  item: SearchResult,
  index: number,
  onMouseEnter: (index: number) => void,
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'lotus-search-result lotus-focus-ring block px-3 py-2.5 transition-colors';
  link.dataset.lotusSearchResult = '';
  link.href = item.href ?? '#';
  link.id = `lotus-search-result-${index}`;
  link.setAttribute('role', 'option');
  link.setAttribute('aria-selected', 'false');
  link.addEventListener('mouseenter', () => onMouseEnter(index));

  const meta = document.createElement('div');
  meta.className = 'mb-1 flex min-w-0 items-center gap-2 text-xs text-(--lotus-text-muted)';

  const section = [item.section, item.group].filter(Boolean).join(' / ');
  if (section) {
    const sectionEl = document.createElement('span');
    sectionEl.className = 'truncate';
    sectionEl.textContent = section;
    meta.append(sectionEl);
  }

  const title = document.createElement('div');
  title.className = 'truncate text-sm font-medium text-(--lotus-text-strong)';
  title.textContent = item.title ?? '';

  const excerpt = document.createElement('p');
  excerpt.className = 'mt-1 line-clamp-2 text-sm leading-6 text-(--lotus-text-muted)';
  excerpt.textContent = item.description || item.excerpt || '';

  if (meta.childNodes.length) {
    link.append(meta);
  }

  link.append(title);

  if (excerpt.textContent) {
    link.append(excerpt);
  }

  return link;
}

export function createSearchResultList(
  items: SearchResult[],
  onMouseEnter: (index: number) => void,
): HTMLElement {
  const list = document.createElement('div');
  list.className = 'space-y-1';

  items.forEach((item, index) => {
    list.append(createSearchResultElement(item, index, onMouseEnter));
  });

  return list;
}
