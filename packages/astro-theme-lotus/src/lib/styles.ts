import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { isHeadStyleSource, type HeadConfig } from './page/head';

const virtualStylesModuleId = 'virtual:prosefly/lotus/styles.css';
const styleFileUrls = [
  new URL('../styles/colors.css', import.meta.url),
  new URL('../styles/tokens.css', import.meta.url),
  new URL('../styles/prose/base.css', import.meta.url),
  new URL('../styles/prose/inline.css', import.meta.url),
  new URL('../styles/prose/lists.css', import.meta.url),
  new URL('../styles/prose/footnotes.css', import.meta.url),
  new URL('../styles/prose/blocks.css', import.meta.url),
  new URL('../styles/prose/code.css', import.meta.url),
  new URL('../styles/prose/media.css', import.meta.url),
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

export function lotusStylesPlugin(
  root: URL,
  srcDir: URL,
  head: HeadConfig = [],
): Plugin {
  const rootPath = fileURLToPath(root);
  const generatedStylesDir = join(rootPath, '.astro', 'lotus');
  const resolvedVirtualStylesModuleId = join(generatedStylesDir, 'styles.css');
  const projectSourceRoot = fileURLToPath(srcDir);
  const projectSourcePath = toCssSourcePath(relative(generatedStylesDir, projectSourceRoot));
  const lotusSourcePath = toCssSourcePath(relative(generatedStylesDir, lotusSourceRoot));
  const customStyleFiles = resolveHeadStyleFiles(rootPath, head);

  return {
    name: '@prosefly/astro-theme-lotus/styles',
    buildStart() {
      writeLotusStylesFile(
        resolvedVirtualStylesModuleId,
        projectSourcePath,
        lotusSourcePath,
        customStyleFiles,
      );

      for (const file of [
        ...styleFileUrls.map((url) => fileURLToPath(url)),
        ...customStyleFiles,
      ]) {
        this.addWatchFile(file);
      }
    },
    resolveId(id) {
      if (id === virtualStylesModuleId) {
        writeLotusStylesFile(
          resolvedVirtualStylesModuleId,
          projectSourcePath,
          lotusSourcePath,
          customStyleFiles,
        );
        return resolvedVirtualStylesModuleId;
      }
    },
  };
}

function writeLotusStylesFile(
  file: string,
  projectSourcePath: string,
  lotusSourcePath: string,
  customStyleFiles: string[],
) {
  mkdirSync(dirname(file), { recursive: true });

  writeFileSync(
    file,
    [
      `@import "tailwindcss" source("${projectSourcePath}");`,
      `@source "${lotusSourcePath}";`,
      ...styleFileUrls.map((url) => readFileSync(fileURLToPath(url), 'utf8')),
      baseCss,
      ...customStyleFiles.map((styleFile) => readFileSync(styleFile, 'utf8')),
    ].join('\n\n'),
  );
}

function resolveHeadStyleFiles(rootPath: string, head: HeadConfig): string[] {
  return head.filter(isHeadStyleSource).map((entry) => {
    const { src } = entry;
    const file = isAbsolute(src) ? src : join(rootPath, src);

    if (!existsSync(file)) {
      throw new Error(`Lotus head style file not found: ${src}`);
    }

    return file;
  });
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
