import type { AstroIntegration } from 'astro';
import { getLocales, localizeDocsHref } from '../i18n';
import type {
  LotusThemeConfig,
  SidebarGroupItem,
  SidebarItemConfig,
  SidebarLinkItem,
  SidebarOpenApiOptions,
} from '../theme';
import { findOpenApiModule } from './module';
import type {
  OpenApiManifest,
  OpenApiModule,
  OpenApiNavItem,
  OpenApiPageRecord,
  OpenApiReference,
  ResolvedOpenApiConfig,
} from './types';

export interface PreparedOpenApi {
  config: LotusThemeConfig;
  integration?: AstroIntegration;
  manifest: OpenApiManifest;
}

interface PrepareOpenApiOptions {
  module?: OpenApiModule | null;
  addWatchFile?: (file: string) => void;
}

export async function prepareOpenApi(
  config: LotusThemeConfig,
  root: URL,
  options: PrepareOpenApiOptions = {},
): Promise<PreparedOpenApi> {
  const docsNav = await Promise.all(config.docsNav.map(async (section) => ({
    ...section,
    items: await section.items,
  })));
  const resolvedConfig = { ...config, docsNav };
  const hasSidebarItems = docsNav.some((section) => hasOpenApiItem(section.items));

  if (!resolvedConfig.openapi) {
    if (hasSidebarItems) {
      throw new Error('OpenAPI sidebar items require a top-level `openapi` configuration.');
    }

    return {
      config: resolvedConfig,
      manifest: { root: root.href, pages: [], sources: [] },
    };
  }

  const module = options.module === null
    ? undefined
    : options.module ?? await findOpenApiModule();

  if (!module) {
    return {
      config: disableOpenApi(resolvedConfig),
      manifest: { root: root.href, pages: [], sources: [] },
    };
  }

  const sources = module.resolveOpenApiSources(resolvedConfig.openapi);
  const references = new Map<string, OpenApiReference>();

  for (const source of sources) {
    options.addWatchFile?.(source.file);
    references.set(getSourceKey(source.source), await module.loadOpenApiReference({ config: source }, root));
  }

  const expandedDocsNav = await Promise.all(docsNav.map(async (section) => ({
    ...section,
    items: await expandSidebarItems(section.items, sources, references, module, root),
  })));
  const preparedConfig = { ...resolvedConfig, docsNav: expandedDocsNav };
  const manifest = createOpenApiManifest(preparedConfig, root, references);

  return {
    config: preparedConfig,
    integration: module.default(resolvedConfig.openapi),
    manifest,
  };
}

function disableOpenApi(config: LotusThemeConfig): LotusThemeConfig {
  return {
    ...config,
    openapi: undefined,
    docsNav: config.docsNav.flatMap((section) => {
      const items = removeOpenApiItems(section.items as SidebarItemConfig[]);

      if (items.length === 0 && hasOpenApiItem(section.items as SidebarItemConfig[])) {
        return [];
      }

      return [{ ...section, items }];
    }),
  };
}

function removeOpenApiItems(items: SidebarItemConfig[]): SidebarItemConfig[] {
  return items.flatMap((item): SidebarItemConfig[] => {
    if (!item || typeof item !== 'object') {
      return [item];
    }

    if ('openapi' in item) {
      return [];
    }

    if ('items' in item && Array.isArray(item.items)) {
      const nestedItems = removeOpenApiItems(item.items);

      if (nestedItems.length === 0 && hasOpenApiItem(item.items)) {
        return [];
      }

      return [{ ...item, items: nestedItems } satisfies SidebarGroupItem];
    }

    return [item];
  });
}

function hasOpenApiItem(items: SidebarItemConfig[]): boolean {
  return items.some((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    if ('openapi' in item) {
      return true;
    }

    return 'items' in item && Array.isArray(item.items) && hasOpenApiItem(item.items);
  });
}

async function expandSidebarItems(
  items: SidebarItemConfig[],
  sources: ResolvedOpenApiConfig[],
  references: Map<string, OpenApiReference>,
  module: OpenApiModule,
  root: URL,
): Promise<SidebarItemConfig[]> {
  const expanded = await Promise.all(items.map(async (item): Promise<SidebarItemConfig[]> => {
    if (!item || typeof item !== 'object') {
      return [item];
    }

    if ('openapi' in item) {
      const source = selectSource(sources, item.openapi);
      const sourceKey = getSourceKey(source.source);
      const hasDisplayOptions = item.openapi.introduction !== undefined || item.openapi.methodBadge !== undefined;
      const reference = hasDisplayOptions
        ? await module.loadOpenApiReference({ config: source, ...item.openapi }, root)
        : references.get(sourceKey)!;

      return reference.navigation.map((navItem) => mapNavigationItem(navItem, sourceKey));
    }

    if ('items' in item) {
      return [{
        ...item,
        items: await expandSidebarItems(item.items as SidebarItemConfig[], sources, references, module, root),
      } satisfies SidebarGroupItem];
    }

    return [item];
  }));

  return expanded.flat();
}

function selectSource(
  sources: ResolvedOpenApiConfig[],
  options: SidebarOpenApiOptions,
): ResolvedOpenApiConfig {
  if (options.source !== undefined) {
    const source = sources.find((candidate) => candidate.source === options.source);

    if (!source) {
      const available = sources.flatMap((candidate) => candidate.source ?? []);
      throw new Error(
        `Unknown OpenAPI source "${options.source}" in docsNav. Available sources: ${available.join(', ') || '(none)'}.`,
      );
    }

    return source;
  }

  if (sources.length === 1) {
    return sources[0]!;
  }

  throw new Error(
    `Multiple OpenAPI sources are configured. Select one in docsNav with `
    + '`{ openapi: { source: "..." } }`.',
  );
}

function mapNavigationItem(item: OpenApiNavItem, sourceKey: string): SidebarItemConfig {
  if ('items' in item) {
    return {
      label: item.label,
      icon: item.icon,
      collapsed: item.collapsed,
      items: item.items.map((child) => mapNavigationItem(child, sourceKey)),
    } satisfies SidebarGroupItem;
  }

  return {
    label: item.label,
    link: item.link,
    icon: item.icon,
    badge: item.badge,
    slug: getOpenApiIdentity(sourceKey, item.slug ?? item.link),
  } satisfies SidebarLinkItem;
}

function createOpenApiManifest(
  config: LotusThemeConfig,
  root: URL,
  references: Map<string, OpenApiReference>,
): OpenApiManifest {
  const pages: OpenApiPageRecord[] = [];

  for (const [sourceKey, reference] of references) {
    const source = reference.config.source;
    const entries = [
      reference.introduction,
      ...reference.operations,
      ...reference.webhooks,
    ];

    for (const locale of getLocales(config)) {
      for (const entry of entries) {
        const unlocalizedHref = entry.data.type === 'introduction'
          ? `${reference.config.base.replace(/\/+$/, '') || ''}/`
          : `${reference.config.base.replace(/\/+$/, '')}/${entry.id}/`;
        const href = localizeDocsHref(config, unlocalizedHref || '/', locale.key);
        const route = normalizeRoute(href);
        const markdownHref = entry.data.type === 'introduction'
          ? `${route === '/' ? '' : route}/index.md`
          : `${route}.md`;

        pages.push({
          sourceKey,
          source,
          entryId: entry.id,
          kind: entry.data.type,
          localeKey: locale.key,
          identity: getOpenApiIdentity(sourceKey, entry.id),
          href,
          route,
          markdownHref: markdownHref || '/index.md',
        });
      }
    }
  }

  assertUniqueRoutes(pages);

  return {
    root: root.href,
    pages,
    sources: [...references.keys()].map((key) => ({
      key,
      source: references.get(key)?.config.source,
    })),
  };
}

function assertUniqueRoutes(pages: OpenApiPageRecord[]) {
  const owners = new Map<string, OpenApiPageRecord>();

  for (const page of pages) {
    for (const route of [page.route, page.markdownHref]) {
      const previous = owners.get(route);

      if (!previous) {
        owners.set(route, page);
        continue;
      }

      if (previous.sourceKey === page.sourceKey && previous.entryId === page.entryId) {
        continue;
      }

      throw new Error(
        `OpenAPI route "${route}" is generated by both `
        + `"${previous.sourceKey}:${previous.entryId}" and "${page.sourceKey}:${page.entryId}".`,
      );
    }
  }
}

export function getOpenApiInjectedRoutes(manifest: OpenApiManifest) {
  const indexEntrypoint = new URL('../../routes/openapi-index.astro', import.meta.url);
  const docsEntrypoint = new URL('../../routes/openapi-docs.astro', import.meta.url);
  const markdownEntrypoint = new URL('../../routes/openapi.md.ts', import.meta.url);
  const routes = new Map<string, URL>();

  for (const page of manifest.pages) {
    routes.set(
      page.route,
      page.kind === 'introduction' ? indexEntrypoint : docsEntrypoint,
    );
    routes.set(page.markdownHref, markdownEntrypoint);
  }

  return [...routes].map(([pattern, entrypoint]) => ({ pattern, entrypoint }));
}

export function getOpenApiIdentity(sourceKey: string, entryId: string): string {
  return `openapi:${sourceKey}:${entryId}`;
}

export function getSourceKey(source: string | undefined): string {
  return source === undefined ? 'single' : `source:${source}`;
}

function normalizeRoute(path: string): string {
  const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/+$/g, '');

  return normalized || '/';
}
