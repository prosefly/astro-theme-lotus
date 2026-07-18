import type { CollectionEntry } from 'astro:content';
import type { ContributorInfo, ContributorsConfig, LotusThemeConfig } from '../theme';
import { getEntrySourcePath as getSourceEntryPath } from '../source';
import { getContributorsConfig, shouldShowContributors } from './config';
import { loadGitContributors } from './git';
import { loadGithubContributors } from './github';

type DocsEntry = CollectionEntry<'docs'>;

const contributorCache = new Map<string, Promise<ContributorInfo[]>>();

async function loadContributors(
  sourcePath: string,
  options: ContributorsConfig,
): Promise<ContributorInfo[]> {
  const githubContributors = options.github
    ? await loadGithubContributors(sourcePath, options)
    : [];

  if (githubContributors.length > 0) {
    return githubContributors;
  }

  return loadGitContributors(sourcePath, options);
}

export function getEntrySourcePath(config: LotusThemeConfig, entry: DocsEntry): string {
  const contributorsConfig = getContributorsConfig(config);

  return getSourceEntryPath(config, entry, contributorsConfig);
}

export function getContributorsEnabled(
  config: LotusThemeConfig,
  entry: DocsEntry,
): boolean {
  return shouldShowContributors(config, entry);
}

export function getEntryContributors(
  config: LotusThemeConfig,
  entry: DocsEntry,
): Promise<ContributorInfo[]> {
  if (!shouldShowContributors(config, entry)) {
    return Promise.resolve([]);
  }

  const options = getContributorsConfig(config);
  const sourcePath = getEntrySourcePath(config, entry);
  const cacheKey = `${sourcePath}\n${JSON.stringify(options)}`;
  const cached = contributorCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const contributors = loadContributors(sourcePath, options);

  contributorCache.set(cacheKey, contributors);
  return contributors;
}
