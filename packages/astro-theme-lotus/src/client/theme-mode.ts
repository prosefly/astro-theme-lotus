declare global {
  interface Window {
    __lotusThemeSwitchReady?: boolean;
  }
}

export {};

const storageKey = 'lotus-theme';
const root = document.documentElement;
const modes = ['system', 'light', 'dark'] as const;

type ThemeMode = typeof modes[number];

function getThemeLabel(switcher: HTMLElement, mode: ThemeMode): string {
  const labelKey = `themeLabel${mode[0].toUpperCase()}${mode.slice(1)}`;

  return switcher.dataset[labelKey] || mode[0].toUpperCase() + mode.slice(1);
}

function isThemeMode(mode: string | undefined | null): mode is ThemeMode {
  return modes.includes(mode as ThemeMode);
}

function initThemeSwitches(): void {
  const switches = Array.from(document.querySelectorAll<HTMLElement>('[data-lotus-theme-switch]'));

  if (!switches.length) {
    return;
  }

  const setTheme = (mode: string | undefined | null) => {
    const nextMode = isThemeMode(mode) ? mode : 'system';
    root.dataset.theme = nextMode;

    if (nextMode === 'system') {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, nextMode);
    }

    switches.forEach((switcher) => {
      switcher.querySelectorAll('[data-theme-mode]').forEach((control) => {
        const active = control.getAttribute('data-theme-mode') === nextMode;
        control.setAttribute('aria-pressed', active ? 'true' : 'false');
        control.toggleAttribute('data-active', active);
      });

      switcher.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((select) => {
        select.value = nextMode;
      });

      switcher.querySelectorAll('[data-theme-current]').forEach((label) => {
        label.textContent = getThemeLabel(switcher, nextMode);
      });

      switcher.querySelectorAll<HTMLElement>('[data-theme-mode-icon]').forEach((icon) => {
        icon.hidden = icon.getAttribute('data-theme-mode-icon') !== nextMode;
      });
    });
  };

  const savedTheme = window.localStorage.getItem(storageKey);
  setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : root.dataset.theme || 'system');

  switches.forEach((switcher) => {
    if (switcher.dataset.lotusThemeSwitchReady) {
      return;
    }

    switcher.dataset.lotusThemeSwitchReady = 'true';

    switcher.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const cycleButton = event.target.closest('[data-theme-cycle]');

      if (cycleButton) {
        const currentMode = isThemeMode(root.dataset.theme) ? root.dataset.theme : 'system';
        const currentIndex = modes.indexOf(currentMode);
        setTheme(modes[(currentIndex + 1) % modes.length]);
        return;
      }

      const button = event.target.closest('[data-theme-mode]');

      if (button) {
        setTheme(button.getAttribute('data-theme-mode'));
      }
    });

    switcher.addEventListener('change', (event) => {
      if (event.target instanceof HTMLSelectElement && event.target.matches('[data-theme-select]')) {
        setTheme(event.target.value);
      }
    });
  });
}

if (!window.__lotusThemeSwitchReady) {
  window.__lotusThemeSwitchReady = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitches, { once: true });
  } else {
    initThemeSwitches();
  }

  document.addEventListener('astro:page-load', initThemeSwitches);
}
