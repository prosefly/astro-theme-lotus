import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CollectionEntry } from 'astro:content';
import type { ContributorInfo, ContributorsConfig, LotusThemeConfig } from './theme';
import {
  getEntrySourcePath as getSourceEntryPath,
  normalizeHostedRepo,
  resolveSourceConfig,
} from './source';

type DocsEntry = CollectionEntry<'docs'>;

interface GithubRepo {
  owner: string;
  repo: string;
}

interface GithubCommitAuthor {
  login?: string;
  avatar_url?: string;
  html_url?: string;
}

interface GithubCommit {
  author?: GithubCommitAuthor | null;
  commit?: {
    author?: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
  };
}

const execFileAsync = promisify(execFile);
const contributorCache = new Map<string, Promise<ContributorInfo[]>>();

function normalizeContributorsConfig(
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

function getContributorsConfig(config: LotusThemeConfig): ContributorsConfig {
  const options = normalizeContributorsConfig(config);

  if (!options) {
    return {};
  }

  const source = resolveSourceConfig(config);
  const sourceGithub = options.avatar === 'github' ? source.github : undefined;

  return {
    ...options,
    branch: options.branch ?? source.branch,
    contentRoot: options.contentRoot ?? source.contentRoot,
    github: options.github ?? sourceGithub,
  };
}

function shouldShowContributors(config: LotusThemeConfig, entry: DocsEntry): boolean {
  if (entry.data.contributors === false) {
    return false;
  }

  return Boolean(normalizeContributorsConfig(config));
}

function getContributorKey(contributor: Pick<ContributorInfo, 'email' | 'name' | 'username'>): string {
  if (contributor.username) {
    return `github:${contributor.username.trim().toLowerCase()}`;
  }

  return `${contributor.name.trim().toLowerCase()}\n${(contributor.email ?? '').trim().toLowerCase()}`;
}

function isExcluded(
  contributor: Pick<ContributorInfo, 'email' | 'name' | 'username'>,
  excluded: Set<string>,
): boolean {
  return (
    excluded.has(contributor.name.trim().toLowerCase()) ||
    Boolean(contributor.email && excluded.has(contributor.email.trim().toLowerCase())) ||
    Boolean(contributor.username && excluded.has(contributor.username.trim().toLowerCase()))
  );
}

function getExcludedContributors(options: ContributorsConfig): Set<string> {
  return new Set((options.exclude ?? []).map((value) => value.trim().toLowerCase()));
}

function sortContributors(contributors: Iterable<ContributorInfo>, max = 8): ContributorInfo[] {
  return [...contributors]
    .sort((left, right) => {
      if (right.commits !== left.commits) {
        return right.commits - left.commits;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, max);
}

function normalizeGithubRepo(repo: string | undefined): GithubRepo | undefined {
  const hostedRepo = normalizeHostedRepo(repo, 'https://github.com');
  const [owner, repoName] = hostedRepo?.path.split('/') ?? [];

  if (!owner || !repoName) {
    return undefined;
  }

  return { owner, repo: repoName };
}

function getGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function getGravatarUrl(email: string): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=80`;
}

function applyAvatarProvider(
  contributor: ContributorInfo,
  options: ContributorsConfig,
): ContributorInfo {
  if (contributor.avatarUrl || options.avatar !== 'gravatar' || !contributor.email) {
    return contributor;
  }

  return {
    ...contributor,
    avatarUrl: getGravatarUrl(contributor.email),
  };
}

function mergeContributor(
  contributors: Map<string, ContributorInfo>,
  contributor: ContributorInfo,
) {
  const key = getContributorKey(contributor);
  const existing = contributors.get(key);

  if (existing) {
    existing.commits += contributor.commits;

    if (!existing.avatarUrl && contributor.avatarUrl) {
      existing.avatarUrl = contributor.avatarUrl;
    }

    if (!existing.profileUrl && contributor.profileUrl) {
      existing.profileUrl = contributor.profileUrl;
    }

    if (!existing.username && contributor.username) {
      existing.username = contributor.username;
    }

    if (
      contributor.lastCommit &&
      (!existing.lastCommit || contributor.lastCommit > existing.lastCommit)
    ) {
      existing.lastCommit = contributor.lastCommit;
    }

    return;
  }

  contributors.set(key, contributor);
}

async function loadGitContributors(
  sourcePath: string,
  options: ContributorsConfig,
): Promise<ContributorInfo[]> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      [
        'log',
        '--follow',
        '--format=%aN%x1f%aE%x1f%aI',
        '--',
        sourcePath,
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024,
      },
    );
    const excluded = getExcludedContributors(options);
    const contributors = new Map<string, ContributorInfo>();

    for (const line of stdout.split('\n')) {
      const [name = '', email = '', date = ''] = line.split('\x1f');
      const normalizedName = name.trim();
      const normalizedEmail = email.trim();

      if (!normalizedName) {
        continue;
      }

      const contributor: ContributorInfo = {
        name: normalizedName,
        commits: 1,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(date ? { lastCommit: date } : {}),
      };

      if (isExcluded(contributor, excluded)) {
        continue;
      }

      mergeContributor(contributors, applyAvatarProvider(contributor, options));
    }

    return sortContributors(contributors.values(), options.max);
  } catch {
    return [];
  }
}

async function loadGithubContributors(
  sourcePath: string,
  options: ContributorsConfig,
): Promise<ContributorInfo[]> {
  const repo = normalizeGithubRepo(options.github);

  if (!repo) {
    return [];
  }

  const excluded = getExcludedContributors(options);
  const contributors = new Map<string, ContributorInfo>();
  const token = getGithubToken();
  let page = 1;

  try {
    while (page <= 3) {
      const url = new URL(
        `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits`,
      );

      url.searchParams.set('path', sourcePath);
      url.searchParams.set('sha', options.branch ?? 'main');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', String(page));

      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'prosefly-astro-theme-lotus',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(3500),
      });

      if (!response.ok) {
        return [];
      }

      const commits = (await response.json()) as GithubCommit[];

      if (!commits.length) {
        break;
      }

      for (const commit of commits) {
        const author = commit.commit?.author;
        const githubAuthor = commit.author;
        const name = githubAuthor?.login ?? author?.name;

        if (!name) {
          continue;
        }

        const contributor: ContributorInfo = {
          name,
          commits: 1,
          ...(author?.email ? { email: author.email } : {}),
          ...(githubAuthor?.login ? { username: githubAuthor.login } : {}),
          ...(githubAuthor?.avatar_url ? { avatarUrl: githubAuthor.avatar_url } : {}),
          ...(githubAuthor?.html_url ? { profileUrl: githubAuthor.html_url } : {}),
          ...(author?.date ? { lastCommit: author.date } : {}),
        };

        if (isExcluded(contributor, excluded)) {
          continue;
        }

        mergeContributor(contributors, applyAvatarProvider(contributor, options));
      }

      if (commits.length < 100) {
        break;
      }

      page += 1;
    }

    return sortContributors(contributors.values(), options.max);
  } catch {
    return [];
  }
}

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
