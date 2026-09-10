import type { OpenApiModule } from './types';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const packageName = '@prosefly-pro/astro-openapi';

export async function loadOpenApiModule(
  importer: () => Promise<unknown> = importOpenApiPackage,
): Promise<OpenApiModule> {
  const module = await findOpenApiModule(importer);

  if (!module) {
    throw new Error(
      'Lotus OpenAPI support requires the restricted optional package '
      + '`@prosefly-pro/astro-openapi`.',
    );
  }

  return module;
}

export async function findOpenApiModule(
  importer: () => Promise<unknown> = importOpenApiPackage,
): Promise<OpenApiModule | undefined> {
  let imported: unknown;

  try {
    imported = await importer();
  } catch (error) {
    if (isMissingOpenApiPackage(error)) {
      return undefined;
    }

    throw error;
  }

  if (!isOpenApiModule(imported)) {
    throw new Error(
      'The installed `@prosefly-pro/astro-openapi` version does not expose '
      + '`loadOpenApiReference()` and `resolveOpenApiSources()`. Update the package.',
    );
  }

  return imported;
}

async function importOpenApiPackage(): Promise<unknown> {
  const require = createRequire(import.meta.url);
  const entrypoint = require.resolve(packageName);
  const nativeImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<unknown>;

  return nativeImport(pathToFileURL(entrypoint).href);
}

function isMissingOpenApiPackage(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  return (
    (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND')
    && error.message.includes(packageName)
  );
}

function isOpenApiModule(value: unknown): value is OpenApiModule {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const module = value as Partial<OpenApiModule>;

  return (
    typeof module.default === 'function'
    && typeof module.loadOpenApiReference === 'function'
    && typeof module.resolveOpenApiSources === 'function'
  );
}
