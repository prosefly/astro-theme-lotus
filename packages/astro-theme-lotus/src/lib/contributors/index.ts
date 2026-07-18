import type { CollectionEntry } from 'astro:content';
import type { ContributorInfo, ContributorsConfig, LotusThemeConfig } from '../theme';
import { applyAvatarProvider } from './avatar';
import { getEntrySourcePath as getSourceEntryPath } from '../source';
import { getContributorsConfig, shouldShowContributors } from './config';
import { loadGitContributors } from './git';
import {
  applyGithubContributorProfile,
  loadGithubRepoContributors,
} from './github';

type DocsEntry = CollectionEntry<'docs'>;

const contributorCache = new Map<string, Promise<ContributorInfo[]>>();

async function loadContributors(
  sourcePath: string,
  options: ContributorsConfig,
): Promise<ContributorInfo[]> {
  const gitContributors = await loadGitContributors(sourcePath, options);

  if (options.avatar === false) {
    return gitContributors;
  }

  if (options.github && options.avatar !== 'gravatar') {
    const githubContributors = await loadGithubRepoContributors(options);

    if (githubContributors.size > 0) {
      return gitContributors.map((contributor) => (
        applyAvatarProvider(
          applyGithubContributorProfile(contributor, githubContributors),
          options,
        )
      ));
    }
  }

  return gitContributors.map((contributor) => applyAvatarProvider(contributor, options));
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
