import { getSearchKeyboardAction } from './keyboard';
import { getSearchMessages } from './messages';
import { createSearchProvider } from './provider';
import { createSearchMessageElement, createSearchResultList } from './render';
import type { SearchResult } from './types';

export {};

declare global {
  interface Window {
    __lotusSearchDialogReady?: boolean;
  }
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

  const messages = getSearchMessages(dialog);
  let activeResults: SearchResult[] = [];
  let selectedIndex = -1;
  let providerReady = false;

  const setMessage = (message: string) => {
    activeResults = [];
    selectedIndex = -1;
    input.removeAttribute('aria-activedescendant');
    results.replaceChildren();
    results.append(createSearchMessageElement(message));
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

    const activeLink = links[selectedIndex];

    if (activeLink?.id) {
      input.setAttribute('aria-activedescendant', activeLink.id);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
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

    results.append(createSearchResultList(activeResults, (index) => {
      selectedIndex = index;
      updateSelectedResult();
    }));
    updateSelectedResult();
  };

  const handleSearchKeydown = (event: KeyboardEvent) => {
    const action = getSearchKeyboardAction(event);

    if (action === 'next') {
      event.preventDefault();
      moveSelectedResult(1);
      return;
    }

    if (action === 'previous') {
      event.preventDefault();
      moveSelectedResult(-1);
      return;
    }

    if (action === 'submit') {
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

    input.setAttribute('aria-expanded', 'true');
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

    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
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

  dialog.addEventListener('close', () => {
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
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
