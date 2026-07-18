import type { CollectionEntry } from 'astro:content';
import type { ContributorsConfig, LotusThemeConfig } from '../theme';
import { resolveSourceConfig } from '../source';

type DocsEntry = CollectionEntry<'docs'>;

export function normalizeContributorsConfig(
  config: LotusThemeConfig,
): ContributorsConfig | false {
  const option = config.contributors;

  if (!option) {
    return false;
  }

  if (option === true) {
    return {};
  }

  return option;
}

export function getContributorsConfig(config: LotusThemeConfig): ContributorsConfig {
  const options = normalizeContributorsConfig(config);

  if (!options) {
    return {};
  }

  const source = resolveSourceConfig(config);
  const sourceGithub = options.avatar === 'github' ? source.github : undefined;

  return {
    ...options,
    branch: options.branch ?? source.branch,
    github: options.github ?? sourceGithub,
  };
}

export function shouldShowContributors(
  config: LotusThemeConfig,
  entry: DocsEntry,
): boolean {
  if (entry.data.contributors === false) {
    return false;
  }

  return Boolean(normalizeContributorsConfig(config));
}

export function getExcludedContributors(options: ContributorsConfig): Set<string> {
  return new Set((options.exclude ?? []).map((value) => value.trim().toLowerCase()));
}
