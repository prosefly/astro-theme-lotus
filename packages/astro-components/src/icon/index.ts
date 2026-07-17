import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';

export interface IconIntegrationOptions {
  apiBase?: string;
  preload?: string[];
  scan?: boolean;
}

const virtualIconConfigModuleId = 'virtual:prosefly/astro-components/icon/config';
const resolvedVirtualIconConfigModuleId = `\0${virtualIconConfigModuleId}`;

interface IconPreloadConfig {
  apiBase: string;
  iconsByPrefix: Record<string, string[]>;
}

const componentIconNames = [
  'lucide:badge-alert',
  'lucide:check',
  'lucide:chevron-right',
  'lucide:copy',
  'lucide:file',
  'lucide:folder',
  'lucide:folder-open',
  'lucide:info',
  'lucide:lightbulb',
  'lucide:triangle-alert',
] as const;

function addIconName(iconNames: Set<string>, icon?: string): void {
  if (!icon) {
    return;
  }

  iconNames.add(icon);
}

async function collectStaticIconNames(root: URL): Promise<Set<string>> {
  const sourceRoot = join(fileURLToPath(root), 'src');
  const iconNames = new Set<string>();
  const supportedExtensions = new Set(['.astro', '.md', '.mdx']);
  const iconPatterns = [
    /<Icon\b[^>]*\bname\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/g,
    /<[A-Z][\w.:/-]*\b[^>]*\bicon\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/g,
  ];

  async function scanDirectory(directory: string): Promise<void> {
    let entries: Dirent[];

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(entryPath);
          return;
        }

        if (!entry.isFile() || !supportedExtensions.has(extname(entry.name))) {
          return;
        }

        const source = await readFile(entryPath, 'utf8');

        for (const iconPattern of iconPatterns) {
          for (const match of source.matchAll(iconPattern)) {
            addIconName(iconNames, match[1] ?? match[2] ?? match[3]);
          }
        }
      }),
    );
  }

  await scanDirectory(sourceRoot);
  return iconNames;
}

function groupIconNames(iconNames: Iterable<string>): Record<string, string[]> {
  const grouped = new Map<string, Set<string>>();

  for (const name of iconNames) {
    const separatorIndex = name.indexOf(':');

    if (separatorIndex <= 0 || separatorIndex === name.length - 1) {
      continue;
    }

    const prefix = name.slice(0, separatorIndex);
    const icon = name.slice(separatorIndex + 1);
    const icons = grouped.get(prefix) ?? new Set<string>();

    icons.add(icon);
    grouped.set(prefix, icons);
  }

  return Object.fromEntries(
    [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([prefix, icons]) => [prefix, [...icons].sort()]),
  );
}

function iconConfigPlugin(config: IconPreloadConfig): Plugin {
  return {
    name: '@prosefly/astro-components/icon/config',
    resolveId(id) {
      if (id === virtualIconConfigModuleId) {
        return resolvedVirtualIconConfigModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualIconConfigModuleId) {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}

export default function icon(options: IconIntegrationOptions = {}): AstroIntegration {
  return {
    name: '@prosefly/astro-components/icon',
    hooks: {
      'astro:config:setup': async ({ addMiddleware, config, updateConfig }) => {
        const iconNames = new Set<string>();

        for (const icon of componentIconNames) {
          addIconName(iconNames, icon);
        }

        for (const icon of options.preload ?? []) {
          addIconName(iconNames, icon);
        }

        if (options.scan !== false) {
          for (const icon of await collectStaticIconNames(config.root)) {
            addIconName(iconNames, icon);
          }
        }

        const iconsByPrefix = groupIconNames(iconNames);

        if (Object.keys(iconsByPrefix).length === 0) {
          return;
        }

        updateConfig({
          vite: {
            plugins: [
              iconConfigPlugin({
                apiBase: (options.apiBase ?? 'https://api.iconify.design').replace(/\/$/, ''),
                iconsByPrefix,
              }),
            ],
          },
        });

        addMiddleware({
          order: 'pre',
          entrypoint: new URL('./middleware.js', import.meta.url),
        });
      },
    },
  };
}
