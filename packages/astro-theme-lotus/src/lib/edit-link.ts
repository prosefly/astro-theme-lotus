import type { CollectionEntry } from 'astro:content';
import type { EditLinkConfig, LotusThemeConfig } from './theme';

type DocsEntry = CollectionEntry<'docs'>;

interface HostedRepo {
  origin: string;
  path: string;
}

function normalizeRepoPath(path: string, stripKnownRoutes = false): string {
  const segments = path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  const knownRouteIndex = stripKnownRoutes
    ? segments.findIndex((segment) =>
        segment === '-' ||
        segment === '_edit' ||
        segment === 'edit' ||
        segment === 'src' ||
        segment === 'branch',
      )
    : -1;
  const repoSegments = knownRouteIndex === -1 ? segments : segments.slice(0, knownRouteIndex);

  return repoSegments.join('/').replace(/\.git$/, '');
}

function normalizeHostedRepo(repo: string, defaultOrigin: string): HostedRepo | undefined {
  const input = repo.trim();

  if (!input) {
    return undefined;
  }

  try {
    const url = new URL(input);
    const path = normalizeRepoPath(url.pathname, true);

    return path ? { origin: url.origin, path } : undefined;
  } catch {
    // Continue with shorthand and SSH-style formats.
  }

  const sshMatch = input.match(/^git@([^:]+):(.+)$/);

  if (sshMatch) {
    const [, host, repoPath] = sshMatch;
    const path = normalizeRepoPath(repoPath);

    return path ? { origin: `https://${host}`, path } : undefined;
  }

  const path = normalizeRepoPath(input);

  if (!/^[^\s]+\/[^\s]+$/.test(path)) {
    return undefined;
  }

  return { origin: defaultOrigin, path };
}

function getEditLinkPattern(config: EditLinkConfig): string | undefined {
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

function joinPath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
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

  if (!config.editLink) {
    return undefined;
  }

  const pattern = getEditLinkPattern(config.editLink);

  if (!pattern) {
    return undefined;
  }

  const branch = config.editLink.branch ?? 'main';
  const contentRoot = config.editLink.contentRoot ?? 'src/content';
  const sourcePath = joinPath(contentRoot, `${entry.id}.mdx`);

  return applyEditLinkPattern(pattern, sourcePath, branch);
}
