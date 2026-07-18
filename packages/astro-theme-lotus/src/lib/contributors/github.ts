import type { ContributorInfo, ContributorsConfig } from '../theme';
import { normalizeHostedRepo } from '../source';
import { getExcludedContributors } from './config';
import { isExcluded } from './utils';

interface GithubRepo {
  owner: string;
  repo: string;
}

interface GithubContributor {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
}

interface GithubContributorProfile {
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  profileUrl?: string;
  contributions?: number;
}

interface GithubUser {
  name?: string | null;
  email?: string | null;
}

const repoContributorsCache = new Map<string, Promise<Map<string, GithubContributorProfile>>>();
const DEFAULT_GITHUB_PROFILE_LIMIT = 10;

function normalizeGithubRepo(repo: string | undefined): GithubRepo | undefined {
  const hostedRepo = normalizeHostedRepo(repo, 'https://github.com');
  const [owner, repoName] = hostedRepo?.path.split('/') ?? [];

  if (!owner || !repoName) {
    return undefined;
  }

  return { owner, repo: repoName };
}

export function getGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

export async function loadGithubRepoContributors(
  options: ContributorsConfig,
): Promise<Map<string, GithubContributorProfile>> {
  const repo = normalizeGithubRepo(options.github);

  if (!repo) {
    return new Map();
  }

  const profileLimit = getGithubProfileLimit(options);
  const excluded = getExcludedContributors(options);
  const cacheKey = [
    `${repo.owner}/${repo.repo}`,
    profileLimit,
    [...excluded].sort().join(','),
  ].join('\n');
  const cached = repoContributorsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const contributors = fetchGithubRepoContributors(repo, options);

  repoContributorsCache.set(cacheKey, contributors);
  return contributors;
}

async function fetchGithubRepoContributors(
  repo: GithubRepo,
  options: ContributorsConfig,
): Promise<Map<string, GithubContributorProfile>> {
  const contributors = new Map<string, GithubContributorProfile>();
  const excluded = getExcludedContributors(options);
  const profileLimit = getGithubProfileLimit(options);
  const token = getGithubToken();
  let page = 1;

  try {
    while (true) {
      const url = new URL(
        `https://api.github.com/repos/${repo.owner}/${repo.repo}/contributors`,
      );

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
        return new Map();
      }

      const items = (await response.json()) as GithubContributor[];

      if (!items.length) {
        break;
      }

      for (const item of items) {
        const username = item.login?.trim();

        if (!username) {
          continue;
        }

        if (isExcluded({ name: username, username }, excluded)) {
          continue;
        }

        contributors.set(username.toLowerCase(), {
          username,
          ...(item.avatar_url ? { avatarUrl: item.avatar_url } : {}),
          ...(item.html_url ? { profileUrl: item.html_url } : {}),
          ...(item.contributions ? { contributions: item.contributions } : {}),
        });
      }

      if (items.length < 100) {
        break;
      }

      page += 1;
    }

    await loadGithubUserProfiles(contributors, profileLimit);

    return contributors;
  } catch {
    return new Map();
  }
}

export function applyGithubContributorProfile(
  contributor: ContributorInfo,
  githubContributors: Map<string, GithubContributorProfile>,
): ContributorInfo {
  const profile = getGithubContributorProfile(contributor, githubContributors);

  if (!profile) {
    return contributor;
  }

  return {
    ...contributor,
    username: contributor.username ?? profile.username,
    avatarUrl: profile.avatarUrl ?? contributor.avatarUrl,
    profileUrl: profile.profileUrl ?? contributor.profileUrl,
  };
}

function getGithubContributorProfile(
  contributor: ContributorInfo,
  githubContributors: Map<string, GithubContributorProfile>,
): GithubContributorProfile | undefined {
  for (const candidate of getGithubContributorCandidates(contributor)) {
    const profile = githubContributors.get(candidate);

    if (profile) {
      return profile;
    }
  }

  const normalizedName = normalizeGithubContributorCandidate(contributor.name);
  const normalizedEmail = normalizeGithubContributorCandidate(contributor.email);

  if (normalizedEmail) {
    for (const profile of githubContributors.values()) {
      if (normalizeGithubContributorCandidate(profile.email) === normalizedEmail) {
        return profile;
      }
    }
  }

  if (normalizedName) {
    for (const profile of githubContributors.values()) {
      if (normalizeGithubContributorCandidate(profile.fullName) === normalizedName) {
        return profile;
      }
    }
  }

  if (githubContributors.size === 1) {
    return githubContributors.values().next().value;
  }

  return undefined;
}

function getGithubContributorCandidates(contributor: ContributorInfo): string[] {
  const candidates = [
    contributor.username,
    getGithubUsernameFromEmail(contributor.email),
    contributor.name,
  ];

  return candidates
    .map((candidate) => normalizeGithubContributorCandidate(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));
}

async function loadGithubUserProfiles(
  contributors: Map<string, GithubContributorProfile>,
  limit: number,
): Promise<void> {
  if (limit <= 0) {
    return;
  }

  const token = getGithubToken();
  const profiles = [...contributors.values()].slice(0, limit);

  await Promise.all(profiles.map(async (profile) => {
    try {
      const response = await fetch(`https://api.github.com/users/${profile.username}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'prosefly-astro-theme-lotus',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(3500),
      });

      if (!response.ok) {
        return;
      }

      const user = (await response.json()) as GithubUser;
      const fullName = user.name?.trim();
      const email = user.email?.trim();

      if (fullName) {
        profile.fullName = fullName;
      }

      if (email) {
        profile.email = email;
      }
    } catch {
      // Profile names are only used to improve matching. Avatar fallback still works.
    }
  }));
}

function getGithubProfileLimit(options: ContributorsConfig): number {
  const limit = options.githubProfileLimit ?? DEFAULT_GITHUB_PROFILE_LIMIT;

  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.floor(limit);
}

function normalizeGithubContributorCandidate(candidate: string | undefined): string | undefined {
  const normalized = candidate?.replace(/^@/, '').trim().toLowerCase();

  return normalized || undefined;
}

function getGithubUsernameFromEmail(email: string | undefined): string | undefined {
  if (!email) {
    return undefined;
  }

  const normalized = email.trim().toLowerCase();
  const prefixedMatch = normalized.match(/^\d+\+([^@]+)@users\.noreply\.github\.com$/);

  if (prefixedMatch?.[1]) {
    return prefixedMatch[1];
  }

  const match = normalized.match(/^([^@]+)@users\.noreply\.github\.com$/);

  return match?.[1];
}
