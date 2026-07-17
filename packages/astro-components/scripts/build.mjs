import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(packageRoot, 'src');
const outputRoot = resolve(packageRoot, 'dist');
const assetExtensions = new Set(['.astro', '.css', '.js', '.d.ts']);

async function getAssetFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return getAssetFiles(entryPath);
      }

      if (entry.isFile() && [...assetExtensions].some((extension) => entry.name.endsWith(extension))) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

await rm(outputRoot, { force: true, recursive: true });
await execFileAsync('tsc', ['-p', './tsconfig.build.json'], {
  cwd: packageRoot,
  stdio: 'inherit',
});

const assetFiles = await getAssetFiles(sourceRoot);

await Promise.all(
  assetFiles.map(async (file) => {
    const source = resolve(sourceRoot, file);
    const target = resolve(outputRoot, relative(sourceRoot, source));

    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
  }),
);

const indexTypesPath = resolve(outputRoot, 'index.d.ts');
const indexTypes = await readFile(indexTypesPath, 'utf8');
const astroShimReference = '/// <reference path="./astro-shim.d.ts" />\n';

if (!indexTypes.startsWith(astroShimReference)) {
  await writeFile(indexTypesPath, `${astroShimReference}${indexTypes}`);
}
