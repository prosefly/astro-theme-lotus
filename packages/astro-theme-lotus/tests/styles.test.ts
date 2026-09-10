import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lotusStylesPlugin } from '../src/lib/styles';

describe('Lotus styles', () => {
  it('appends project head style sources after Lotus styles', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lotus-styles-'));

    try {
      writeFileSync(join(root, 'custom.css'), ':root { --lotus-accent: hotpink; }');
      const watchedFiles: string[] = [];
      const plugin = lotusStylesPlugin(
        pathToFileURL(`${root}/`),
        pathToFileURL(`${root}/src/`),
        [
          { tag: 'meta', attrs: { property: 'og:image', content: 'https://example.com/og.png' } },
          { tag: 'style', src: './custom.css' },
        ],
      );

      const buildStart = typeof plugin.buildStart === 'function'
        ? plugin.buildStart
        : plugin.buildStart?.handler;
      if (!buildStart) {
        throw new Error('Expected the Lotus styles plugin to define buildStart');
      }

      const pluginContext = {
        addWatchFile(file: string) {
          watchedFiles.push(file);
        },
      } as unknown as ThisParameterType<typeof buildStart>;
      const inputOptions = {} as Parameters<typeof buildStart>[0];

      await buildStart.call(pluginContext, inputOptions);

      const generatedCss = readFileSync(join(root, '.astro/lotus/styles.css'), 'utf8');

      expect(generatedCss).toMatch(/@plugin ".*typography\/src\/index\.js";/);
      expect(generatedCss).toContain('.prose :where(blockquote)');
      expect(generatedCss).toContain('quotes: none;');
      expect(generatedCss).toContain(':root { --lotus-accent: hotpink; }');
      expect(generatedCss.lastIndexOf(':root { --lotus-accent: hotpink; }')).toBeGreaterThan(
        generatedCss.indexOf('--lotus-background'),
      );
      expect(watchedFiles).toContain(join(root, 'custom.css'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails clearly when a head style source is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'lotus-styles-'));

    try {
      expect(() => lotusStylesPlugin(
        pathToFileURL(`${root}/`),
        pathToFileURL(`${root}/src/`),
        [{ tag: 'style', src: './missing.css' }],
      )).toThrow('Lotus head style file not found: ./missing.css');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
