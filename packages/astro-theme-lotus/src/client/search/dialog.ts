import { createLocalSearchProvider } from './providers/local';
import { createPagefindSearchProvider } from './providers/pagefind';
import type { SearchProvider, SearchResult } from './types';

export {};

declare global {
  interface Window {
    __lotusSearchDialogReady?: boolean;
  }
}

interface SearchMessages {
  loading: string;
  noResults: string;
  typeToSearch: string;
  unavailable: string;
}

function getMessage(dialog: Element, name: string, fallback: string): string {
  return dialog.getAttribute(name) || fallback;
}

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

function createSearchProvider(dialog: Element): SearchProvider | undefined {
  const provider = dialog.getAttribute('data-lotus-search-provider') || 'local';

  if (provider === 'local') {
    const indexUrl = dialog.getAttribute('data-lotus-search-index');

    return indexUrl ? createLocalSearchProvider(indexUrl) : undefined;
  }

  if (provider === 'pagefind') {
    const bundlePath = dialog.getAttribute('data-lotus-pagefind-bundle');

    return bundlePath ? createPagefindSearchProvider(bundlePath) : undefined;
  }

  return createUnavailableProvider();
}

function initSearchDialog(): void {
  const dialog = document.querySelector('[data-lotus-search-dialog]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-lotus-search-input]');
  const results = dialog?.querySelector<HTMLElement>('[data-lotus-search-results]');
  const triggers = Array.from(document.querySelectorAll('[data-lotus-search-trigger]'));

  if (!(dialog instanceof HTMLDialogElement) || !input || !results || !triggers.length) {
    return;
  }

  const provider = createSearchProvider(dialog);

  if (!provider) {
    return;
  }

  const messages: SearchMessages = {
    loading: getMessage(dialog, 'data-lotus-search-loading', 'Loading search index...'),
    noResults: getMessage(dialog, 'data-lotus-search-no-results', 'No results found.'),
    typeToSearch: getMessage(dialog, 'data-lotus-search-type-to-search', 'Type to search documentation.'),
    unavailable: getMessage(dialog, 'data-lotus-search-unavailable', 'Search is unavailable.'),
  };
  let activeResults: SearchResult[] = [];
  let selectedIndex = -1;
  let providerReady = false;

  const setMessage = (message: string) => {
    activeResults = [];
    selectedIndex = -1;
    results.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'px-3 py-8 text-center text-sm text-(--lotus-text-muted)';
    empty.textContent = message;
    results.append(empty);
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

  const createResult = (item: SearchResult, index: number) => {
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
    const query = input.value.trim();

    if (!query) {
      setMessage(messages.typeToSearch);
      return;
    }

    if (!providerReady) {
      setMessage(messages.loading);
    }

    try {
      activeResults = await provider.search(query);
      providerReady = true;
    } catch {
      setMessage(messages.unavailable);
      return;
    }

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
    if (!providerReady) {
      provider.load()
        .then(() => {
          providerReady = true;
        })
        .catch(() => {
          setMessage(messages.unavailable);
        });
    }
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
