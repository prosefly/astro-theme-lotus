declare global {
  interface Window {
    __proseflyTabsInit?: () => void;
  }
}

export {};

type ActivateOptions = {
  focus?: boolean;
  persist?: boolean;
};

function getStoredLabel(syncKey: string | null): string | undefined {
  if (!syncKey) return undefined;
  try {
    return localStorage.getItem(`pl-tabs:${syncKey}`) ?? undefined;
  } catch {
    return undefined;
  }
}

function storeLabel(syncKey: string | null, label: string | null): void {
  if (!syncKey || !label) return;
  try {
    localStorage.setItem(`pl-tabs:${syncKey}`, label);
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('Clipboard API is not available.');
}

function setCopyState(button: HTMLButtonElement, copied: boolean): void {
  const copyIcon = button.querySelector('[data-pl-tabs-copy-icon="copy"]');
  const checkIcon = button.querySelector('[data-pl-tabs-copy-icon="check"]');

  copyIcon?.toggleAttribute('hidden', copied);
  checkIcon?.toggleAttribute('hidden', !copied);
  button.setAttribute('aria-label', copied ? 'Copied' : 'Copy code');
  button.setAttribute('title', copied ? 'Copied' : 'Copy code');
}

function getActiveCode(root: Element): string {
  const activePanel = root.querySelector('.pl-tabs__panel:not([hidden])');
  const code = activePanel?.querySelector('pre code');

  return code?.textContent ?? '';
}

function setActiveIcon(root: Element, panelId: string | null): void {
  const iconContainer = root.querySelector<HTMLElement>('.pl-tabs__active-icons');
  const icons = [...root.querySelectorAll('[data-pl-tabs-icon-for]')];

  if (!(iconContainer instanceof HTMLElement)) return;

  let hasActiveIcon = false;
  icons.forEach((icon) => {
    const isActive = icon.getAttribute('data-pl-tabs-icon-for') === panelId;
    icon.toggleAttribute('hidden', !isActive);
    hasActiveIcon ||= isActive;
  });
  iconContainer.toggleAttribute('hidden', !hasActiveIcon);
}

function activate(root: Element, trigger: Element, options: ActivateOptions = {}): void {
  const panelId = trigger.getAttribute('data-tab-panel');
  const label = trigger.getAttribute('data-tab-label');
  const syncKey = root.getAttribute('data-sync-key');
  const triggers = [...root.querySelectorAll('[data-pl-tabs-trigger]')];
  const panels = [...root.querySelectorAll('.pl-tabs__panel')];

  triggers.forEach((button) => {
    const isActive = button === trigger;
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  panels.forEach((panel) => {
    panel.toggleAttribute('hidden', panel.id !== panelId);
  });

  setActiveIcon(root, panelId);

  if (options.focus && trigger instanceof HTMLElement) {
    trigger.focus();
  }

  if (options.persist === false) {
    return;
  }

  storeLabel(syncKey, label);

  if (!syncKey || !label) {
    return;
  }

  document.querySelectorAll('[data-pl-tabs]').forEach((otherRoot) => {
    if (otherRoot === root || otherRoot.getAttribute('data-sync-key') !== syncKey) {
      return;
    }

    const matchingTrigger = [
      ...otherRoot.querySelectorAll('[data-pl-tabs-trigger]'),
    ].find((button) => button.getAttribute('data-tab-label') === label);

    if (matchingTrigger) {
      activate(otherRoot, matchingTrigger, { persist: false });
    }
  });
}

if (!window.__proseflyTabsInit) {
  window.__proseflyTabsInit = () => {
    document.querySelectorAll('[data-pl-tabs]').forEach((root) => {
      if (root instanceof HTMLElement && root.dataset.plTabsReady === 'true') {
        return;
      }

      const triggers = [...root.querySelectorAll('[data-pl-tabs-trigger]')];
      const syncKey = root.getAttribute('data-sync-key');
      const storedLabel = getStoredLabel(syncKey);
      const storedTrigger = storedLabel
        ? triggers.find((button) => button.getAttribute('data-tab-label') === storedLabel)
        : undefined;
      const selectedTrigger =
        storedTrigger ??
        triggers.find((button) => button.getAttribute('aria-selected') === 'true') ??
        triggers[0];

      if (root instanceof HTMLElement) {
        root.dataset.plTabsReady = 'true';
      }

      if (selectedTrigger) {
        activate(root, selectedTrigger, { persist: false });
      }

      triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => activate(root, trigger));
        trigger.addEventListener('keydown', (event) => {
          if (!(event instanceof KeyboardEvent)) {
            return;
          }

          const currentIndex = triggers.indexOf(trigger);
          let nextIndex = currentIndex;

          if (event.key === 'ArrowRight') nextIndex = currentIndex + 1;
          else if (event.key === 'ArrowLeft') nextIndex = currentIndex - 1;
          else if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = triggers.length - 1;
          else return;

          event.preventDefault();
          const nextTrigger =
            triggers[(nextIndex + triggers.length) % triggers.length];
          activate(root, nextTrigger, { focus: true });
        });
      });

      root.querySelectorAll('[data-pl-tabs-copy]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        button.addEventListener('click', async () => {
          const text = getActiveCode(root);

          if (!text) {
            return;
          }

          try {
            await writeClipboard(text);
            setCopyState(button, true);
            window.setTimeout(() => setCopyState(button, false), 1600);
          } catch {
            setCopyState(button, false);
          }
        });
      });
    });
  };

  document.addEventListener('astro:page-load', window.__proseflyTabsInit);
}

window.__proseflyTabsInit();
