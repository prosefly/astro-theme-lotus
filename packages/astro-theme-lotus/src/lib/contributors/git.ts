import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ContributorInfo, ContributorsConfig } from '../theme';
import { applyAvatarProvider } from './avatar';
import { getExcludedContributors } from './config';
import { isExcluded, mergeContributor, sortContributors } from './utils';

const execFileAsync = promisify(execFile);

export async function loadGitContributors(
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
