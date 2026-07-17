import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const virtualStylesModuleId = 'virtual:prosefly/lotus/styles.css';
const styleFileUrls = [
  new URL('../styles/colors.css', import.meta.url),
  new URL('../styles/tokens.css', import.meta.url),
  new URL('../styles/prose.css', import.meta.url),
  new URL('../styles/components.css', import.meta.url),
];
const lotusSourceRoot = fileURLToPath(new URL('..', import.meta.url));

const baseCss = `
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
`;

export function lotusStylesPlugin(root: URL, srcDir: URL): Plugin {
  const rootPath = fileURLToPath(root);
  const generatedStylesDir = join(rootPath, '.astro', 'lotus');
  const resolvedVirtualStylesModuleId = join(generatedStylesDir, 'styles.css');
  const projectSourceRoot = fileURLToPath(srcDir);
  const projectSourcePath = toCssSourcePath(relative(generatedStylesDir, projectSourceRoot));
  const lotusSourcePath = toCssSourcePath(relative(generatedStylesDir, lotusSourceRoot));

  return {
    name: '@prosefly/astro-theme-lotus/styles',
    buildStart() {
      writeLotusStylesFile(resolvedVirtualStylesModuleId, projectSourcePath, lotusSourcePath);

      for (const url of styleFileUrls) {
        this.addWatchFile(fileURLToPath(url));
      }
    },
    resolveId(id) {
      if (id === virtualStylesModuleId) {
        writeLotusStylesFile(resolvedVirtualStylesModuleId, projectSourcePath, lotusSourcePath);
        return resolvedVirtualStylesModuleId;
      }
    },
  };
}

function writeLotusStylesFile(
  file: string,
  projectSourcePath: string,
  lotusSourcePath: string,
) {
  mkdirSync(dirname(file), { recursive: true });

  writeFileSync(
    file,
    [
      `@import "tailwindcss" source("${projectSourcePath}");`,
      `@source "${lotusSourcePath}";`,
      ...styleFileUrls.map((url) => readFileSync(fileURLToPath(url), 'utf8')),
      baseCss,
    ].join('\n\n'),
  );
}

function toCssSourcePath(path: string): string {
  const cssPath = toCssPath(path);

  if (cssPath.startsWith('.')) {
    return cssPath;
  }

  if (cssPath.startsWith('/')) {
    return cssPath;
  }

  return `./${cssPath}`;
}

function toCssPath(path: string): string {
  return path.split(sep).join('/');
}
