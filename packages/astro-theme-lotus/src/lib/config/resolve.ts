import { readPublicImageDimensions } from '../image-size';
import type {
  LotusThemeConfig,
  SidebarGroupItem,
  SidebarItemConfig,
} from '../theme';
import { defaultConfig, DEFAULT_DOCS_BASE_PATH } from './defaults';
import type { LotusIntegrationOptions } from './options';

export function resolveLotusConfig(options: LotusIntegrationOptions): LotusThemeConfig {
  const {
    markdown: _markdown,
    ...themeOptions
  } = options;

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
    sidebars: await Promise.all(config.sidebars.map(async (sidebar) => ({
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
