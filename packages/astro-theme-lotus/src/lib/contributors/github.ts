import type { ContributorInfo, ContributorsConfig } from '../theme';
import { normalizeHostedRepo } from '../source';
import { applyAvatarProvider } from './avatar';
import { getExcludedContributors } from './config';
import { isExcluded, mergeContributor, sortContributors } from './utils';

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

export async function loadGithubContributors(
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
