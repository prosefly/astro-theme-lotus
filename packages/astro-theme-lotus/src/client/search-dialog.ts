interface SearchItem {
  title?: string;
  description?: string;
  excerpt?: string;
  section?: string;
  group?: string;
  content?: string;
  href?: string;
}

interface SearchResult {
  item: SearchItem;
  score: number;
}

export {};

declare global {
  interface Window {
    __lotusSearchDialogReady?: boolean;
  }
}

function getMessage(dialog: Element, name: string, fallback: string): string {
  return dialog.getAttribute(name) || fallback;
}

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(item: SearchItem, tokens: string[]): number {
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

function initSearchDialog(): void {
  const dialog = document.querySelector('[data-lotus-search-dialog]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-lotus-search-input]');
  const results = dialog?.querySelector<HTMLElement>('[data-lotus-search-results]');
  const triggers = Array.from(document.querySelectorAll('[data-lotus-search-trigger]'));
  const indexUrl = dialog?.getAttribute('data-lotus-search-index');

  if (!(dialog instanceof HTMLDialogElement) || !input || !results || !indexUrl || !triggers.length) {
    return;
  }

  const messages = {
    loading: getMessage(dialog, 'data-lotus-search-loading', 'Loading search index...'),
    noResults: getMessage(dialog, 'data-lotus-search-no-results', 'No results found.'),
    typeToSearch: getMessage(dialog, 'data-lotus-search-type-to-search', 'Type to search documentation.'),
    unavailable: getMessage(dialog, 'data-lotus-search-unavailable', 'Search is unavailable.'),
  };
  let searchIndex: SearchItem[] | undefined;
  let loadingIndex: Promise<SearchItem[]> | undefined;
  let activeResults: SearchItem[] = [];
  let selectedIndex = -1;

  const setMessage = (message: string) => {
    activeResults = [];
    selectedIndex = -1;
    results.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'px-3 py-8 text-center text-sm text-(--lotus-text-muted)';
    empty.textContent = message;
    results.append(empty);
  };

  const loadIndex = async () => {
    if (searchIndex) {
      return searchIndex;
    }

    if (!loadingIndex) {
      loadingIndex = fetch(indexUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Search index request failed: ${response.status}`);
          }

          return response.json();
        })
        .then((data): SearchItem[] => {
          const items = Array.isArray(data.items) ? data.items : [];
          searchIndex = items;
          return items;
        })
        .catch(() => {
          setMessage(messages.unavailable);
          return [];
        });
    }

    return loadingIndex;
  };

  const updateSelectedResult = () => {
    const links = Array.from(results.querySelectorAll('[data-lotus-search-result]'));

    links.forEach((link, index) => {
      const isActive = index === selectedIndex;
      link.toggleAttribute('data-active', isActive);
      link.setAttribute('aria-selected', String(isActive));

      if (isActive) {
        link.scrollIntoView({ block: 'nearest' });
      }
    });
  };

  const navigateToSelectedResult = () => {
    const item = activeResults[selectedIndex] ?? activeResults[0];

    if (item?.href) {
      window.location.href = item.href;
    }
  };

  const moveSelectedResult = (direction: number) => {
    if (!activeResults.length) {
      return;
    }

    selectedIndex = (selectedIndex + direction + activeResults.length) % activeResults.length;
    updateSelectedResult();
  };

  const createResult = (item: SearchItem, index: number) => {
    const link = document.createElement('a');
    link.className = 'lotus-search-result lotus-focus-ring block px-3 py-2.5 transition-colors';
    link.dataset.lotusSearchResult = '';
    link.href = item.href ?? '#';
    link.id = `lotus-search-result-${index}`;
    link.setAttribute('role', 'option');
    link.setAttribute('aria-selected', 'false');
    link.addEventListener('mouseenter', () => {
      selectedIndex = index;
      updateSelectedResult();
    });

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
  };

  const renderResults = async () => {
    const tokens = tokenize(input.value);

    if (!tokens.length) {
      setMessage(messages.typeToSearch);
      return;
    }

    if (!searchIndex) {
      setMessage(messages.loading);
    }

    const items = await loadIndex();
    activeResults = items
      .map((item): SearchResult => ({ item, score: scoreItem(item, tokens) }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((result) => result.item);
    selectedIndex = activeResults.length ? 0 : -1;

    results.replaceChildren();

    if (!activeResults.length) {
      setMessage(messages.noResults);
      return;
    }

    const list = document.createElement('div');
    list.className = 'space-y-1';

    activeResults.forEach((item, index) => {
      list.append(createResult(item, index));
    });

    results.append(list);
    updateSelectedResult();
  };

  const handleSearchKeydown = (event: KeyboardEvent) => {
    if (event.isComposing) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelectedResult(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelectedResult(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      navigateToSelectedResult();
    }
  };

  const openDialog = () => {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    window.setTimeout(() => input.focus(), 0);
    loadIndex();
  };

  const closeDialog = () => {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', openDialog);
  });

  dialog.querySelector('[data-lotus-search-close]')?.addEventListener('click', closeDialog);
  dialog.querySelector('[data-lotus-search-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    navigateToSelectedResult();
  });
  input.addEventListener('keydown', handleSearchKeydown);
  input.addEventListener('input', renderResults);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });
}

if (!window.__lotusSearchDialogReady) {
  window.__lotusSearchDialogReady = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchDialog, { once: true });
  } else {
    initSearchDialog();
  }
}
