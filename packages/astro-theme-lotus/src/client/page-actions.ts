async function getLotusCopyText(root: HTMLElement): Promise<string> {
  const markdownUrl = root.dataset.lotusPageMarkdownUrl;

  if (!markdownUrl) {
    throw new Error('Markdown URL is not available.');
  }

  const response = await fetch(markdownUrl, {
    headers: {
      Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Markdown page: ${response.status}`);
  }

  return response.text();
}

async function writeLotusClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is not available.');
  }

  await navigator.clipboard.writeText(text);
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
          await writeLotusClipboard(await getLotusCopyText(root));

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
