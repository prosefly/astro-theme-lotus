import type { CollectionEntry } from 'astro:content';
import type { EditLinkConfig, LotusThemeConfig, ThemeSourceConfig } from './theme';
import {
  getEntrySourcePath,
  getSourceBranch,
  mergeSourceConfig,
  normalizeHostedRepo,
} from './source';

type DocsEntry = CollectionEntry<'docs'>;

function getEditLinkSource(
  config: LotusThemeConfig,
): ThemeSourceConfig | undefined {
  if (config.editLink === true) {
    return mergeSourceConfig(config);
  }

  if (!config.editLink || typeof config.editLink === 'boolean') {
    return undefined;
  }

  return mergeSourceConfig(config, config.editLink);
}

function getEditLinkPattern(config: ThemeSourceConfig | EditLinkConfig): string | undefined {
  if ('pattern' in config && config.pattern) {
    return config.pattern;
  }

  if ('github' in config && config.github) {
    const repo = normalizeHostedRepo(config.github, 'https://github.com');

    return repo ? `${repo.origin}/${repo.path}/edit/{branch}/{path}` : undefined;
  }

  if ('gitlab' in config && config.gitlab) {
    const repo = normalizeHostedRepo(config.gitlab, 'https://gitlab.com');

    return repo ? `${repo.origin}/${repo.path}/-/edit/{branch}/{path}` : undefined;
  }

  if ('codeberg' in config && config.codeberg) {
    const repo = normalizeHostedRepo(config.codeberg, 'https://codeberg.org');

    return repo ? `${repo.origin}/${repo.path}/_edit/{branch}/{path}` : undefined;
  }

  return undefined;
}
function applyEditLinkPattern(pattern: string, sourcePath: string, branch: string): string {
  return pattern
    .replaceAll('{path}', sourcePath)
    .replaceAll('{encodedPath}', encodeURIComponent(sourcePath))
    .replaceAll('{branch}', encodeURIComponent(branch));
}

export function resolveEditUrl(
  config: LotusThemeConfig,
  entry: DocsEntry,
): string | boolean | undefined {
  if (entry.data.editUrl === false) {
    return false;
  }

  if (typeof entry.data.editUrl === 'string') {
    return entry.data.editUrl;
  }

  const source = getEditLinkSource(config);

  if (!source) {
    return undefined;
  }

  const pattern = getEditLinkPattern(source);

  if (!pattern) {
    return undefined;
  }

  const branch = getSourceBranch(config, source);
  const sourcePath = getEntrySourcePath(config, entry, source);

  return applyEditLinkPattern(pattern, sourcePath, branch);
}
