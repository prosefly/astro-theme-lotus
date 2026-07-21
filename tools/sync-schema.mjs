import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const source = join(root, 'packages/astro-theme-lotus/src/schema.json');
const target = join(root, 'public/schema.json');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
