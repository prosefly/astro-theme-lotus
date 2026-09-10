import manifest from 'virtual:prosefly/lotus/openapi';
import { loadOpenApiModule } from './module';
import type {
  LoadedOpenApiPage,
  OpenApiExchangeEntry,
  OpenApiIntroductionEntry,
  OpenApiManifest,
  OpenApiPageRecord,
  OpenApiReference,
} from './types';

const openApiManifest = manifest as OpenApiManifest;
const referenceCache = new Map<string, Promise<OpenApiReference>>();

export async function loadOpenApiPage(pathname: string): Promise<LoadedOpenApiPage | undefined> {
  const route = normalizeRoute(pathname);
  const page = openApiManifest.pages.find((candidate) =>
    candidate.route === route || candidate.markdownHref === route
  );

  if (!page) {
    return undefined;
  }

  const reference = await loadReference(page.sourceKey, page.source);
  const entry = getReferenceEntry(reference, page);

  return entry ? { page, reference, entry } : undefined;
}

export async function loadOpenApiPages(localeKey?: string): Promise<LoadedOpenApiPage[]> {
  const pages = localeKey
    ? openApiManifest.pages.filter((page) => page.localeKey === localeKey)
    : openApiManifest.pages;
  const loaded = await Promise.all(pages.map(async (page) => {
    const reference = await loadReference(page.sourceKey, page.source);
    const entry = getReferenceEntry(reference, page);

    return entry ? { page, reference, entry } : undefined;
  }));

  return loaded.filter((page): page is LoadedOpenApiPage => Boolean(page));
}

function loadReference(sourceKey: string, source: string | undefined): Promise<OpenApiReference> {
  let reference = referenceCache.get(sourceKey);

  if (!reference) {
    reference = loadOpenApiModule().then((module) => module.loadOpenApiReference(
      source === undefined ? {} : { source },
      new URL(openApiManifest.root),
    ));
    referenceCache.set(sourceKey, reference);
  }

  return reference;
}

function getReferenceEntry(
  reference: OpenApiReference,
  page: OpenApiPageRecord,
): OpenApiIntroductionEntry | OpenApiExchangeEntry | undefined {
  if (page.kind === 'introduction') {
    return reference.introduction;
  }

  return [...reference.operations, ...reference.webhooks].find((entry) => entry.id === page.entryId);
}

function normalizeRoute(path: string): string {
  const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/+$/g, '');

  return normalized || '/';
}
