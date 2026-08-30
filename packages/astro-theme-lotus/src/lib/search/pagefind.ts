import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LotusThemeConfig } from '../theme';
import { getPagefindOutputSubdir, getPagefindSearchConfig } from './index';

interface PagefindIndex {
  addDirectory(options: { path: string; glob?: string }): Promise<{ errors: string[]; page_count: number }>;
  writeFiles(options: { outputPath: string }): Promise<{ errors: string[] }>;
  deleteIndex(): Promise<unknown>;
}

interface PagefindModule {
  createIndex(options: {
    excludeSelectors: string[];
    rootSelector?: string;
  }): Promise<{ index?: PagefindIndex; errors: string[] }>;
  close(): Promise<unknown>;
}

type PagefindLoader = () => Promise<PagefindModule>;

export async function loadPagefind(importPagefind: PagefindLoader = () => import('pagefind')): Promise<PagefindModule> {
  try {
    return await importPagefind();
  } catch (error) {
    const reason = error instanceof Error && error.message ? ` ${error.message}` : '';
    throw new Error(
      `The Pagefind search provider is enabled, but the optional 'pagefind' package could not be loaded.${reason} Install it with 'pnpm add pagefind' or 'npm install pagefind'.`,
      { cause: error },
    );
  }
}

interface PagefindLogger {
  info(message: string): void;
}

const defaultPagefindExcludeSelectors = [
  '[data-pagefind-ignore]',
  'script',
  'style',
  'nav',
  'footer',
];

export async function buildPagefindIndex(
  config: LotusThemeConfig,
  dir: URL,
  logger: PagefindLogger,
  loadPagefindModule: PagefindLoader = loadPagefind,
): Promise<void> {
  const searchConfig = getPagefindSearchConfig(config);

  if (!searchConfig) {
    return;
  }

  const pagefind = await loadPagefindModule();
  const siteDir = fileURLToPath(dir);
  const outputSubdir = getPagefindOutputSubdir(searchConfig);
  const outputPath = join(siteDir, outputSubdir);
  const { index, errors: createErrors } = await pagefind.createIndex({
    excludeSelectors: [
      ...defaultPagefindExcludeSelectors,
      ...(searchConfig.excludeSelectors ?? []),
    ],
    ...(searchConfig.rootSelector ? { rootSelector: searchConfig.rootSelector } : {}),
  });

  if (!index) {
    throw new Error(createErrors.join('\n') || 'Unable to create Pagefind index.');
  }

  try {
    const { errors: addErrors, page_count: pageCount } = await index.addDirectory({
      path: siteDir,
      glob: '**/*.html',
    });

    if (addErrors.length > 0) {
      throw new Error(addErrors.join('\n'));
    }

    const { errors: writeErrors } = await index.writeFiles({ outputPath });

    if (writeErrors.length > 0) {
      throw new Error(writeErrors.join('\n'));
    }

    logger.info(`Pagefind indexed ${pageCount} page${pageCount === 1 ? '' : 's'} into ${outputSubdir}/`);
  } finally {
    await index.deleteIndex();
    await pagefind.close();
  }
}
