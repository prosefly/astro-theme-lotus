import { getCustomAccentVariables } from '../lib/colors';

const appearanceStorageKeys = {
  accent: 'lotus-preview-accent',
  gray: 'lotus-preview-gray',
  radius: 'lotus-preview-radius',
} as const;

type AppearanceKey = keyof typeof appearanceStorageKeys;
type InitialAppearance = {
  accent: string;
  gray: string;
  radius: string;
  accentLight: string;
  accentDark: string;
};

declare global {
  interface Window {
    __lotusAppearanceInitial?: InitialAppearance;
  }
}

const hexColorPattern = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

function getAppearanceRoot(): HTMLElement {
  return document.documentElement;
}

function getInitialAppearance(): InitialAppearance {
  if (!window.__lotusAppearanceInitial) {
    const root = getAppearanceRoot();

    window.__lotusAppearanceInitial = {
      accent: root.dataset.accent ?? '',
      gray: root.dataset.gray ?? '',
      radius: root.dataset.radius ?? '',
      accentLight: root.style.getPropertyValue('--lotus-accent-light'),
      accentDark: root.style.getPropertyValue('--lotus-accent-dark'),
    };
  }

  return window.__lotusAppearanceInitial;
}

function setAppearanceValue(key: AppearanceKey, value: string): void {
  const root = getAppearanceRoot();

  if (key === 'accent') {
    if (hexColorPattern.test(value)) {
      const customAccent = getCustomAccentVariables(value);

      delete root.dataset.accent;
      root.dataset.customAccent = value;
      for (const [name, color] of Object.entries(customAccent)) {
        root.style.setProperty(name, color);
      }
    } else {
      root.dataset.accent = value;
      delete root.dataset.customAccent;
      root.style.removeProperty('--lotus-accent-light');
      root.style.removeProperty('--lotus-accent-dark');
    }
  } else {
    root.dataset[key] = value;
  }

  window.localStorage.setItem(appearanceStorageKeys[key], value);
}

function getCurrentAppearance() {
  const root = getAppearanceRoot();
  const initialAppearance = getInitialAppearance();

  return {
    accent: root.dataset.customAccent || root.dataset.accent || initialAppearance.accent || 'indigo',
    gray: root.dataset.gray || initialAppearance.gray || 'neutral',
    radius: root.dataset.radius || initialAppearance.radius || 'medium',
  };
}

function updateAppearanceButtons(root: ParentNode = document): void {
  const html = getAppearanceRoot();

  root.querySelectorAll('[data-appearance-key][data-appearance-value]').forEach((button) => {
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const key = button.dataset.appearanceKey as AppearanceKey | undefined;
    const value = button.dataset.appearanceValue;

    if (!key || !value) {
      return;
    }

    button.toggleAttribute('data-active', html.dataset[key] === value);
  });

  root.querySelectorAll('[data-appearance-custom-accent]').forEach((input) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (html.dataset.customAccent && hexColorPattern.test(html.dataset.customAccent)) {
      input.value = html.dataset.customAccent;
    }

    input.toggleAttribute('data-active', Boolean(html.dataset.customAccent));
  });
}

function emitAppearanceChange(): void {
  document.dispatchEvent(
    new CustomEvent('lotus:appearance-change', {
      detail: getCurrentAppearance(),
    }),
  );
}

function updateAllAppearancePalettes(): void {
  document.querySelectorAll('[data-lotus-appearance-palette]').forEach((palette) => {
    updateAppearanceButtons(palette);
  });
  emitAppearanceChange();
}

function restoreInitialAppearance(): void {
  const root = getAppearanceRoot();
  const initialAppearance = getInitialAppearance();

  if (initialAppearance.accent) {
    root.dataset.accent = initialAppearance.accent;
  } else {
    delete root.dataset.accent;
  }

  delete root.dataset.customAccent;
  root.dataset.gray = initialAppearance.gray || 'neutral';
  root.dataset.radius = initialAppearance.radius || 'medium';

  if (initialAppearance.accentLight) {
    root.style.setProperty('--lotus-accent-light', initialAppearance.accentLight);
  } else {
    root.style.removeProperty('--lotus-accent-light');
  }

  if (initialAppearance.accentDark) {
    root.style.setProperty('--lotus-accent-dark', initialAppearance.accentDark);
  } else {
    root.style.removeProperty('--lotus-accent-dark');
  }

  Object.values(appearanceStorageKeys).forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
}

function applySavedAppearance(): void {
  (Object.keys(appearanceStorageKeys) as AppearanceKey[]).forEach((key) => {
    const value = window.localStorage.getItem(appearanceStorageKeys[key]);

    if (value) {
      setAppearanceValue(key, value);
    }
  });
}

function initLotusAppearancePalette(): void {
  getInitialAppearance();
  applySavedAppearance();
  emitAppearanceChange();

  document.querySelectorAll('[data-lotus-appearance-palette]').forEach((palette) => {
    if (!(palette instanceof HTMLElement) || palette.dataset.lotusAppearancePaletteReady) {
      updateAppearanceButtons(palette);
      return;
    }

    palette.dataset.lotusAppearancePaletteReady = 'true';
    updateAppearanceButtons(palette);

    palette.querySelectorAll('[data-appearance-key][data-appearance-value]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!(button instanceof HTMLElement)) {
          return;
        }

        const key = button.dataset.appearanceKey as AppearanceKey | undefined;
        const value = button.dataset.appearanceValue;

        if (!key || !value) {
          return;
        }

        setAppearanceValue(key, value);
        updateAllAppearancePalettes();
      });
    });

    palette.querySelectorAll('[data-appearance-custom-accent]').forEach((input) => {
      input.addEventListener('input', () => {
        if (!(input instanceof HTMLInputElement)) {
          return;
        }

        setAppearanceValue('accent', input.value);
        updateAllAppearancePalettes();
      });
    });

    palette.querySelector('[data-appearance-reset]')?.addEventListener('click', () => {
      restoreInitialAppearance();
      updateAllAppearancePalettes();
    });
  });
}

initLotusAppearancePalette();
document.addEventListener('astro:page-load', initLotusAppearancePalette);
