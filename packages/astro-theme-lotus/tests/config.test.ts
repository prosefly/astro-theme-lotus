import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/lib/config/defaults';
import { resolveLlmsConfig } from '../src/lib/config/llms';
import { normalizeDocsBasePath, resolveLotusConfig } from '../src/lib/config/resolve';
import { getLotusInjectedRoutes } from '../src/lib/routes';

function getRoutePatterns(options: Parameters<typeof resolveLotusConfig>[0]) {
  return getLotusInjectedRoutes(resolveLotusConfig(options)).map((route) => route.pattern);
}

describe('Lotus config', () => {
  it('normalizes empty, relative, and trailing-slash docs bases', () => {
    expect(normalizeDocsBasePath()).toBe('/');
    expect(normalizeDocsBasePath('')).toBe('/');
    expect(normalizeDocsBasePath('docs')).toBe('/docs');
    expect(normalizeDocsBasePath('/docs/')).toBe('/docs');
    expect(normalizeDocsBasePath('//docs//api//')).toBe('/docs/api');
  });

  it('merges nested defaults without losing default objects', () => {
    const config = resolveLotusConfig({
      appearance: {
        accent: 'emerald',
      },
      docsBase: 'docs',
      footer: {
        copyright: 'Copyright',
      },
    });

    expect(config.docsBase).toBe('/docs');
    expect(config.appearance).toEqual({
      ...defaultConfig.appearance,
      accent: 'emerald',
    });
    expect(config.footer).toEqual({
      ...defaultConfig.footer,
      copyright: 'Copyright',
    });
    expect(config.iconify).toEqual(defaultConfig.iconify);
  });

  it('keeps explicit empty page actions instead of falling back to defaults', () => {
    expect(resolveLotusConfig({ pageActions: [] }).pageActions).toEqual([]);
  });

  it('resolves the theme mode control option', () => {
    expect(resolveLotusConfig({}).themeModeControl).toBe('segmented-control');
    expect(resolveLotusConfig({ themeModeControl: false }).themeModeControl).toBe(false);
    expect(resolveLotusConfig({ themeModeControl: 'button' }).themeModeControl).toBe('button');
  });

  it('resolves boolean and full llms settings', () => {
    expect(resolveLlmsConfig(resolveLotusConfig({ llms: false }))).toEqual({
      enabled: false,
      full: false,
    });
    expect(resolveLlmsConfig(resolveLotusConfig({ llms: true }))).toEqual({
      enabled: true,
      full: false,
    });
    expect(resolveLlmsConfig(resolveLotusConfig({ llms: { full: true } }))).toEqual({
      enabled: true,
      full: true,
    });
  });

  it('injects docs, markdown, llms, and local search routes from config', () => {
    expect(getRoutePatterns({})).toEqual([
      '/404',
      '/[...slug]',
      '/[...slug].md',
      '/llms.txt',
      '/search.json',
    ]);

    expect(getRoutePatterns({ docsBase: '/docs/' })).toEqual([
      '/404',
      '/docs/[...slug]',
      '/docs/[...slug].md',
      '/llms.txt',
      '/docs/search.json',
    ]);
  });

  it('only injects optional search and llms routes when enabled', () => {
    expect(getRoutePatterns({
      docsBase: '/docs',
      locales: {
        root: { label: 'English', directory: 'en' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN', directory: 'zh-cn' },
      },
    })).toContain('/docs/[locale]/search.json');

    expect(getRoutePatterns({
      llms: false,
      search: false,
    })).toEqual([
      '/404',
      '/[...slug]',
      '/[...slug].md',
    ]);

    expect(getRoutePatterns({
      search: {
        provider: 'docsearch',
        appId: 'APP',
        apiKey: 'KEY',
        indexName: 'docs',
      },
    })).toEqual([
      '/404',
      '/[...slug]',
      '/[...slug].md',
      '/llms.txt',
    ]);

    expect(getRoutePatterns({ llms: { full: true } })).toContain('/llms-full.txt');
  });
});
