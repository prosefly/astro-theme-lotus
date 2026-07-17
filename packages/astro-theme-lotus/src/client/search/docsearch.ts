export {};

declare global {
  interface Window {
    __lotusDocSearchReady?: boolean;
    docsearch?: (props: DocSearchProps) => DocSearchInstance;
  }
}

interface DocSearchInstance {
  open(): void;
}

interface DocSearchProps {
  container: HTMLElement;
  appId: string;
  apiKey: string;
  indexName: string;
  askAi?: string;
  disableUserPersonalization?: boolean;
  insights?: boolean;
  maxResultsPerGroup?: number;
  placeholder?: string;
  searchParameters?: Record<string, unknown>;
  keyboardShortcuts?: {
    'Ctrl/Cmd+K'?: boolean;
    '/'?: boolean;
  };
}

const defaultCssUrl = 'https://cdn.jsdelivr.net/npm/@docsearch/css@4';
const defaultJsUrl = 'https://cdn.jsdelivr.net/npm/@docsearch/js@4';

function getOptionalBoolean(element: HTMLElement, name: string): boolean | undefined {
  const value = element.dataset[name];

  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
}

function getOptionalNumber(element: HTMLElement, name: string): number | undefined {
  const value = element.dataset[name];

  if (!value) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function getSearchParameters(element: HTMLElement): Record<string, unknown> | undefined {
  const value = element.dataset.lotusDocsearchSearchParameters;

  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function loadStylesheet(href: string): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(`link[data-lotus-docsearch-css="${href}"]`);

  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.dataset.lotusDocsearchCss = href;
    link.href = href;
    link.rel = 'stylesheet';
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => reject(new Error(`Unable to load DocSearch CSS: ${href}`)), { once: true });
    document.head.append(link);
  });
}

function loadScript(src: string): Promise<void> {
  if (window.docsearch) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[data-lotus-docsearch-js="${src}"]`);

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Unable to load DocSearch JS: ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.lotusDocsearchJs = src;
    script.src = src;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load DocSearch JS: ${src}`)), { once: true });
    document.head.append(script);
  });
}

function injectThemeStyles(): void {
  if (document.querySelector('[data-lotus-docsearch-theme]')) {
    return;
  }

  const style = document.createElement('style');
  style.dataset.lotusDocsearchTheme = '';
  style.textContent = `
    :root {
      --docsearch-primary-color: var(--lotus-accent);
      --docsearch-text-color: var(--lotus-text);
      --docsearch-muted-color: var(--lotus-text-muted);
      --docsearch-container-background: rgb(0 0 0 / 35%);
      --docsearch-modal-background: var(--lotus-background);
      --docsearch-searchbox-background: var(--lotus-surface);
      --docsearch-searchbox-focus-background: var(--lotus-background);
      --docsearch-hit-color: var(--lotus-text);
      --docsearch-hit-active-color: var(--lotus-accent-contrast);
      --docsearch-hit-background: var(--lotus-surface);
      --docsearch-footer-background: var(--lotus-background);
      --docsearch-key-gradient: none;
      --docsearch-key-shadow: none;
      --docsearch-modal-shadow: 0 24px 80px rgb(0 0 0 / 18%);
      --docsearch-modal-width: min(42rem, calc(100vw - 2rem));
      --docsearch-modal-height: min(38rem, calc(100dvh - 4rem));
    }

    .DocSearch-Button {
      display: none;
    }

    .DocSearch-Modal {
      border: 1px solid var(--lotus-border-muted);
      border-radius: min(var(--lotus-radius-lg), 1rem);
    }

    .DocSearch-SearchBar,
    .DocSearch-Footer {
      border-color: var(--lotus-border-subtle);
    }

    .DocSearch-Hit a {
      border-radius: min(var(--lotus-radius-md), 0.75rem);
    }
  `;
  document.head.append(style);
}

async function initDocSearch(): Promise<void> {
  const container = document.querySelector<HTMLElement>('[data-lotus-docsearch]');
  const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-lotus-search-trigger]'));

  if (!container || !triggers.length) {
    return;
  }

  const appId = container.dataset.lotusDocsearchAppId;
  const apiKey = container.dataset.lotusDocsearchApiKey;
  const indexName = container.dataset.lotusDocsearchIndexName;

  if (!appId || !apiKey || !indexName) {
    return;
  }

  await loadStylesheet(container.dataset.lotusDocsearchCssUrl || defaultCssUrl);
  injectThemeStyles();
  await loadScript(container.dataset.lotusDocsearchJsUrl || defaultJsUrl);

  if (!window.docsearch) {
    return;
  }

  const instance = window.docsearch({
    container,
    appId,
    apiKey,
    indexName,
    askAi: container.dataset.lotusDocsearchAskAi || undefined,
    disableUserPersonalization: getOptionalBoolean(container, 'lotusDocsearchDisableUserPersonalization'),
    insights: getOptionalBoolean(container, 'lotusDocsearchInsights'),
    keyboardShortcuts: {
      'Ctrl/Cmd+K': true,
      '/': false,
    },
    maxResultsPerGroup: getOptionalNumber(container, 'lotusDocsearchMaxResultsPerGroup'),
    placeholder: container.dataset.lotusDocsearchPlaceholder,
    searchParameters: getSearchParameters(container),
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      instance.open();
    });
  });
}

if (!window.__lotusDocSearchReady) {
  window.__lotusDocSearchReady = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void initDocSearch();
    }, { once: true });
  } else {
    void initDocSearch();
  }
}
