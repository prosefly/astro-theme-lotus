import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import type { LotusThemeConfig } from './theme';
import { getPagefindOutputSubdir } from './search';

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
): Promise<void> {
  if (config.search === false || config.search.provider !== 'pagefind') {
    return;
  }

  const searchConfig = config.search;
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
