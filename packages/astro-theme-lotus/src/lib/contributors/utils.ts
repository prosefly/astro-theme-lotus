import type { ContributorInfo } from '../theme';

export function getContributorKey(
  contributor: Pick<ContributorInfo, 'email' | 'name' | 'username'>,
): string {
  if (contributor.username) {
    return `github:${contributor.username.trim().toLowerCase()}`;
  }

  return `${contributor.name.trim().toLowerCase()}\n${(contributor.email ?? '').trim().toLowerCase()}`;
}

export function isExcluded(
  contributor: Pick<ContributorInfo, 'email' | 'name' | 'username'>,
  excluded: Set<string>,
): boolean {
  return (
    excluded.has(contributor.name.trim().toLowerCase()) ||
    Boolean(contributor.email && excluded.has(contributor.email.trim().toLowerCase())) ||
    Boolean(contributor.username && excluded.has(contributor.username.trim().toLowerCase()))
  );
}

export function sortContributors(
  contributors: Iterable<ContributorInfo>,
  max = 8,
): ContributorInfo[] {
  return [...contributors]
    .sort((left, right) => {
      if (right.commits !== left.commits) {
        return right.commits - left.commits;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, max);
}

export function mergeContributor(
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
