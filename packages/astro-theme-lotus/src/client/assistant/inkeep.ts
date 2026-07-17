export {};

declare global {
  interface Window {
    __lotusInkeepAssistantReady?: boolean;
    Inkeep?: {
      ModalSearchAndChat(settings: InkeepSettings): unknown;
    };
  }
}

interface InkeepSettings {
  defaultView?: string;
  baseSettings: Record<string, unknown>;
  modalSettings?: Record<string, unknown>;
  searchSettings?: Record<string, unknown>;
  aiChatSettings?: Record<string, unknown>;
}

function parseSettings(value: string | undefined): InkeepSettings | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as InkeepSettings;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function loadScript(src: string): Promise<void> {
  if (window.Inkeep) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[data-lotus-inkeep-script="${src}"]`);

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Unable to load Inkeep script: ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.lotusInkeepScript = src;
    script.defer = true;
    script.src = src;
    script.type = 'module';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load Inkeep script: ${src}`)), { once: true });
    document.head.append(script);
  });
}

function withLotusColorMode(settings: InkeepSettings): InkeepSettings {
  return {
    ...settings,
    baseSettings: {
      ...settings.baseSettings,
      colorMode: settings.baseSettings.colorMode ?? {
        sync: {
          target: document.documentElement,
          attributes: ['data-theme'],
          isDarkMode: (attributes: Record<string, string | undefined>) => {
            if (attributes['data-theme'] === 'dark') {
              return true;
            }

            if (attributes['data-theme'] === 'light') {
              return false;
            }

            return window.matchMedia('(prefers-color-scheme: dark)').matches;
          },
        },
      },
    },
  };
}

async function initInkeepAssistant(): Promise<void> {
  const element = document.querySelector<HTMLElement>('[data-lotus-inkeep]');

  if (!element) {
    return;
  }

  const settings = parseSettings(element.dataset.lotusInkeepSettings);
  const scriptUrl = element.dataset.lotusInkeepScriptUrl;

  if (!settings || !scriptUrl) {
    return;
  }

  await loadScript(scriptUrl);

  if (!window.Inkeep) {
    return;
  }

  window.Inkeep.ModalSearchAndChat(withLotusColorMode(settings));
}

if (!window.__lotusInkeepAssistantReady) {
  window.__lotusInkeepAssistantReady = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void initInkeepAssistant();
    }, { once: true });
  } else {
    void initInkeepAssistant();
  }
}
