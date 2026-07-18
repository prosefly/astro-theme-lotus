import { createHash } from 'node:crypto';
import type { ContributorInfo, ContributorsConfig } from '../theme';

export function getGravatarUrl(email: string): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=80`;
}

export function applyAvatarProvider(
  contributor: ContributorInfo,
  options: ContributorsConfig,
): ContributorInfo {
  const shouldUseGravatar = options.avatar === undefined || options.avatar === 'gravatar';

  if (contributor.avatarUrl || !shouldUseGravatar || !contributor.email) {
    return contributor;
  }

  return {
    ...contributor,
    avatarUrl: getGravatarUrl(contributor.email),
  };
}
