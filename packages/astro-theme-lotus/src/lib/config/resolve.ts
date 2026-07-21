import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readPublicImageDimensions } from '../image-size';
import type {
  LotusThemeConfig,
  SidebarGroupItem,
  SidebarItemConfig,
} from '../theme';
import { defaultConfig, DEFAULT_DOCS_BASE_PATH } from './defaults';
import type { LotusIntegrationOptions } from './options';

export const LOTUS_CONFIG_FILE = 'theme.config.json';

type LotusConfigFileOptions = LotusIntegrationOptions & {
  $schema?: string;
};

type LegacyLotusIntegrationOptions = Omit<LotusIntegrationOptions, 'navbar' | 'sidebars'> & {
  navbar?: LotusIntegrationOptions['siteNav'];
  sidebars?: LotusIntegrationOptions['docsNav'];
};

const mergeableOptionKeys = new Set<keyof LotusIntegrationOptions>([
  'appearance',
  'components',
  'footer',
  'iconify',
  'locales',
  'markdown',
  'source',
  'ui',
]);

export function resolveLotusConfig(options: LotusIntegrationOptions): LotusThemeConfig {
  const normalizedOptions = normalizeLegacyLotusConfigOptions(options);
  const {
    markdown: _markdown,
    ...themeOptions
  } = normalizedOptions;

  return {
    ...defaultConfig,
    ...themeOptions,
    appearance: {
      ...defaultConfig.appearance,
      ...themeOptions.appearance,
    },
    pageActions: themeOptions.pageActions ?? defaultConfig.pageActions,
    docsBase: normalizeDocsBasePath(themeOptions.docsBase, defaultConfig.docsBase),
    iconify: {
      ...defaultConfig.iconify,
      ...themeOptions.iconify,
    },
    footer: {
      ...defaultConfig.footer,
      ...themeOptions.footer,
    },
  };
}

export function loadLotusConfigFile(root: URL): LotusIntegrationOptions {
  const configUrl = new URL(LOTUS_CONFIG_FILE, root);
  if (!existsSync(configUrl)) {
    return {};
  }

  const configPath = fileURLToPath(configUrl);

  try {
    const fileConfig = JSON.parse(readFileSync(configUrl, 'utf8')) as LotusConfigFileOptions;
    const { $schema: _schema, ...options } = fileConfig;

    return options;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read ${configPath}: ${message}`);
  }
}

export function mergeLotusConfigOptions(
  ...configs: LotusIntegrationOptions[]
): LotusIntegrationOptions {
  const merged: LotusIntegrationOptions = {};

  for (const config of configs) {
    mergeDefinedProperties(merged, config);
    for (const key of mergeableOptionKeys) {
      mergeObjectProperty(merged, config, key);
    }
  }

  return merged;
}

export function normalizeLegacyLotusConfigOptions(
  options: LotusIntegrationOptions,
  warn: (message: string) => void = () => {},
): LotusIntegrationOptions {
  const legacyOptions = options as LegacyLotusIntegrationOptions;
  const normalized: LegacyLotusIntegrationOptions = { ...legacyOptions };

  if (legacyOptions.navbar !== undefined) {
    warn('Lotus config `navbar` is deprecated. Use `siteNav` instead.');
    normalized.siteNav ??= legacyOptions.navbar;
    delete normalized.navbar;
  }

  if (legacyOptions.sidebars !== undefined) {
    warn('Lotus config `sidebars` is deprecated. Use `docsNav` instead.');
    normalized.docsNav ??= legacyOptions.sidebars;
    delete normalized.sidebars;
  }

  return normalized;
}

export function resolveLocalAssetConfig(
  config: LotusThemeConfig,
  publicDir: URL,
): LotusThemeConfig {
  if (!config.logo || typeof config.logo === 'string') {
    return config;
  }

  if (config.logo.width && config.logo.height) {
    return config;
  }

  const dimensions =
    readPublicImageDimensions(config.logo.light, publicDir)
    ?? readPublicImageDimensions(config.logo.dark, publicDir);
  if (!dimensions) {
    return config;
  }

  return {
    ...config,
    logo: {
      ...config.logo,
      width: config.logo.width ?? dimensions.width,
      height: config.logo.height ?? dimensions.height,
    },
  };
}

export async function resolveAsyncLotusConfig(config: LotusThemeConfig): Promise<LotusThemeConfig> {
  return {
    ...config,
    docsNav: await Promise.all(config.docsNav.map(async (sidebar) => ({
      ...sidebar,
      items: await resolveAsyncSidebarItems(await sidebar.items),
    }))),
  };
}

export function normalizeDocsBasePath(
  basePath?: string,
  fallback = DEFAULT_DOCS_BASE_PATH,
): string {
  const input = basePath?.trim() || fallback;
  const normalized = `/${input}`.replace(/\/+/g, '/').replace(/\/$/, '');

  return normalized || '/';
}

function mergeDefinedProperties(
  target: LotusIntegrationOptions,
  source: LotusIntegrationOptions,
) {
  for (const [key, value] of Object.entries(source) as Array<[keyof LotusIntegrationOptions, unknown]>) {
    if (value !== undefined && !mergeableOptionKeys.has(key)) {
      target[key] = value as never;
    }
  }
}

function mergeObjectProperty<Key extends keyof LotusIntegrationOptions>(
  target: LotusIntegrationOptions,
  source: LotusIntegrationOptions,
  key: Key,
) {
  const value = source[key];
  if (!isPlainObject(value)) {
    return;
  }

  const current = target[key];
  const currentObject: Record<string, unknown> = isPlainObject(current) ? current : {};
  const nextObject: Record<string, unknown> = {
    ...currentObject,
    ...value,
  };

  target[key] = nextObject as LotusIntegrationOptions[Key];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function resolveAsyncSidebarItems(items: SidebarItemConfig[]): Promise<SidebarItemConfig[]> {
  return Promise.all(items.map(async (item): Promise<SidebarItemConfig> => {
    if (!item || typeof item !== 'object' || !('items' in item)) {
      return item;
    }

    return {
      ...item,
      items: await resolveAsyncSidebarItems(await item.items),
    } satisfies SidebarGroupItem;
  }));
}
