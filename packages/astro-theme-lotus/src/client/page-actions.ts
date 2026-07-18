async function getLotusCopyText(root: HTMLElement): Promise<string> {
  const markdownUrl = root.dataset.lotusPageMarkdownUrl;

  if (!markdownUrl) {
    throw new Error('Markdown URL is not available.');
  }

  const response = await fetch(getAbsoluteUrl(markdownUrl, getCurrentPageUrl()), {
    headers: {
      Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Markdown page: ${response.status}`);
  }

  return response.text();
}

function getCurrentPageUrl(): string {
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

function getAbsoluteUrl(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const url = new URL(value, window.location.href);

  if (
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  ) {
    return new URL(`${url.pathname}${url.search}${url.hash}`, window.location.origin).toString();
  }

  return url.toString();
}

function getPageActionValues(root: HTMLElement): Record<string, string> {
  const title = root.dataset.lotusPageTitle ?? document.title;
  const url = getAbsoluteUrl(root.dataset.lotusPageUrl, getCurrentPageUrl());
  const markdownUrl = getAbsoluteUrl(root.dataset.lotusPageMarkdownUrl, url);

  return {
    title,
    url,
    markdownUrl,
    encodedTitle: encodeURIComponent(title),
    encodedUrl: encodeURIComponent(url),
    encodedMarkdownUrl: encodeURIComponent(markdownUrl),
  };
}

function interpolatePageActionHref(template: string, values: Record<string, string>): string {
  return template.replace(
    /\{(title|url|markdownUrl|encodedTitle|encodedUrl|encodedMarkdownUrl)\}/g,
    (_, key: string) => values[key] ?? '',
  );
}

function updateLotusPageActionLinks(root: HTMLElement): void {
  const values = getPageActionValues(root);
  const assistantPromptTemplate = root.dataset.lotusPageAssistantPrompt || 'Read this documentation page: {url}';
  const assistantPrompt = interpolatePageActionHref(assistantPromptTemplate, values);

  root
    .querySelectorAll<HTMLAnchorElement>('a[data-lotus-page-action], a[data-lotus-page-action-href-template]')
    .forEach((link) => {
      const type = link.dataset.lotusPageAction;
      const template = link.dataset.lotusPageActionHrefTemplate;

      if (template) {
        link.href = interpolatePageActionHref(template, values);
        return;
      }

      if (type === 'open-chatgpt') {
        link.href = `https://chatgpt.com/?q=${encodeURIComponent(assistantPrompt)}`;
        return;
      }

      if (type === 'open-claude') {
        link.href = `https://claude.ai/new?q=${encodeURIComponent(assistantPrompt)}`;
      }
    });
}

async function writeLotusClipboard(root: HTMLElement): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API is not available.');
  }

  const text = getLotusCopyText(root);

  if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': text.then((value) => new Blob([value], { type: 'text/plain' })),
      }),
    ]);
    return;
  }

  if (!navigator.clipboard.writeText) {
    throw new Error('Clipboard writeText API is not available.');
  }

  await navigator.clipboard.writeText(await text);
}

function restoreLabel(label: Element | null, text: string): void {
  if (!label) {
    return;
  }

  window.setTimeout(() => {
    label.textContent = text;
  }, 1600);
}

function initLotusPageActions(): void {
  document.querySelectorAll('[data-lotus-page-actions]').forEach((root) => {
    if (!(root instanceof HTMLElement) || root.dataset.lotusPageActionsReady) {
      return;
    }

    root.dataset.lotusPageActionsReady = 'true';
    updateLotusPageActionLinks(root);

    root.querySelectorAll('[data-lotus-copy-page]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const label = button.querySelector('[data-lotus-copy-label]');
      const originalLabel = label?.textContent ?? root.dataset.lotusPageCopyLabel ?? 'Copy page';
      const copyingLabel = root.dataset.lotusPageCopyingLabel ?? 'Copying...';
      const copiedLabel = root.dataset.lotusPageCopiedLabel ?? 'Copied';
      const copyFailedLabel = root.dataset.lotusPageCopyFailedLabel ?? 'Copy failed';

      button.addEventListener('click', async () => {
        button.disabled = true;

        if (label) {
          label.textContent = copyingLabel;
        }

        try {
          await writeLotusClipboard(root);

          if (label) {
            label.textContent = copiedLabel;
            restoreLabel(label, originalLabel);
          }

          const details = button.closest('details');
          if (details) {
            details.open = false;
          }
        } catch {
          if (label) {
            label.textContent = copyFailedLabel;
            restoreLabel(label, originalLabel);
          }
        } finally {
          button.disabled = false;
        }
      });
    });
  });
}

initLotusPageActions();
document.addEventListener('astro:page-load', initLotusPageActions);
