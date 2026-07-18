import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';
import type { LotusThemeConfig, ThemeSourceConfig } from './theme';

type DocsEntry = CollectionEntry<'docs'>;

export interface HostedRepo {
  origin: string;
  path: string;
}

let inferredSourceConfig: ThemeSourceConfig | undefined;
let inferredSourceConfigLoaded = false;

export function joinPath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
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

export function normalizeHostedRepo(
  repo: string | undefined,
  defaultOrigin: string,
): HostedRepo | undefined {
  const input = repo?.trim();

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

function getGitRemoteOrigin(): string | undefined {
  try {
    return execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function getSourceProviderFromRemote(remote: string): ThemeSourceConfig | undefined {
  const repo = normalizeHostedRepo(remote, 'https://github.com');

  if (!repo) {
    return undefined;
  }

  let hostname: string;

  try {
    hostname = new URL(repo.origin).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  const repoUrl = `${repo.origin}/${repo.path}`;

  if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
    return { github: repoUrl };
  }

  if (hostname === 'gitlab.com' || hostname.endsWith('.gitlab.com')) {
    return { gitlab: repoUrl };
  }

  if (hostname === 'codeberg.org' || hostname.endsWith('.codeberg.org')) {
    return { codeberg: repoUrl };
  }

  return undefined;
}

export function getInferredSourceConfig(): ThemeSourceConfig {
  if (!inferredSourceConfigLoaded) {
    inferredSourceConfigLoaded = true;
    inferredSourceConfig = getSourceProviderFromRemote(getGitRemoteOrigin() ?? '');
  }

  return inferredSourceConfig ?? {};
}

export function resolveSourceConfig(config: LotusThemeConfig): ThemeSourceConfig {
  return {
    ...getInferredSourceConfig(),
    ...config.source,
  };
}

export function getSourceBranch(
  config: LotusThemeConfig,
  override?: { branch?: string },
): string {
  return override?.branch ?? resolveSourceConfig(config).branch ?? 'main';
}

export function getEntrySourcePath(
  _config: LotusThemeConfig,
  entry: DocsEntry,
  _override?: ThemeSourceConfig,
): string {
  if (!entry.filePath) {
    return `${entry.id}.mdx`;
  }

  const sourcePath = path.isAbsolute(entry.filePath)
    ? entry.filePath
    : path.resolve(process.cwd(), entry.filePath);

  return normalizePath(path.relative(process.cwd(), sourcePath));
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export function mergeSourceConfig(
  config: LotusThemeConfig,
  override?: ThemeSourceConfig,
): ThemeSourceConfig {
  return {
    ...resolveSourceConfig(config),
    ...override,
  };
}
