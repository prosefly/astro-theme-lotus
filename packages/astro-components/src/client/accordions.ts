declare global {
  interface Window {
    __proseflyAccordionsInit?: () => void;
  }
}

export {};

function getItems(root: Element): HTMLDetailsElement[] {
  return [...root.querySelectorAll(':scope > [data-pl-accordion]')].filter(
    (item): item is HTMLDetailsElement => item instanceof HTMLDetailsElement,
  );
}

function closeSiblings(root: Element, activeItem: HTMLDetailsElement): void {
  if (root.hasAttribute('data-multiple')) return;

  for (const item of getItems(root)) {
    if (item !== activeItem) item.open = false;
  }
}

function openItem(item: HTMLDetailsElement): void {
  const root = item.closest('[data-pl-accordions]');

  item.open = true;
  if (root) closeSiblings(root, item);
}

function openHashTarget(): void {
  if (!location.hash) return;

  const id = decodeURIComponent(location.hash.slice(1));
  const item = document.getElementById(id);

  if (item instanceof HTMLDetailsElement && item.matches('[data-pl-accordion]')) {
    openItem(item);
  }
}

if (!window.__proseflyAccordionsInit) {
  window.__proseflyAccordionsInit = () => {
    document.querySelectorAll('[data-pl-accordions]').forEach((root) => {
      if (!(root instanceof HTMLElement) || root.dataset.plAccordionsReady === 'true') {
        return;
      }

      root.dataset.plAccordionsReady = 'true';

      let defaultValues: string[] = [];
      try {
        defaultValues = JSON.parse(root.getAttribute('data-default-values') || '[]');
      } catch {
        defaultValues = [];
      }

      for (const item of getItems(root)) {
        if (defaultValues.includes(item.getAttribute('data-value') ?? '')) {
          openItem(item);
        }

        item.addEventListener('click', (event) => {
          if (!(event.target instanceof Element) || !event.target.closest('[data-pl-accordion-trigger]')) {
            return;
          }

          if (item.getAttribute('data-disabled') === 'true') {
            event.preventDefault();
            return;
          }

          if (!item.open) {
            closeSiblings(root, item);
          }
        });

        item.addEventListener('toggle', () => {
          if (item.open) closeSiblings(root, item);
        });
      }
    });

    openHashTarget();
  };

  window.addEventListener('hashchange', openHashTarget);
  document.addEventListener('astro:page-load', window.__proseflyAccordionsInit);
}

window.__proseflyAccordionsInit();
