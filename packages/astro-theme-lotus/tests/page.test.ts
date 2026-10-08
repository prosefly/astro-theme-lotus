import { describe, expect, it } from 'vitest';
import { resolveLotusConfig } from '../src/lib/config';
import { createHead, type HeadConfig } from '../src/lib/page/head';
import {
  createLanguageAlternateHead,
  createOpenGraphHead,
  getDocsLanguageAlternates,
  getSeoUrl,
} from '../src/lib/page/seo';

const config = resolveLotusConfig({
  docsBase: '/docs',
  locales: {
    root: { label: 'English', directory: 'en', lang: 'en' },
    'zh-cn': { label: 'Chinese', directory: 'zh-cn', lang: 'zh-CN' },
    ja: { label: 'Japanese', directory: 'ja', lang: 'ja' },
  },
});
const site = new URL('https://prosefly.com');

describe('page SEO', () => {
  it('links real translations of the docs index and includes the default language', () => {
    const alternates = getDocsLanguageAlternates(config, [
      { id: 'en/index', data: {} },
      { id: 'zh-cn/index', data: {} },
    ]);
    const head = createLanguageAlternateHead(alternates.get('en/index')!, site, '/docs/');

    expect(head.map((entry) => entry.attrs)).toEqual([
      { rel: 'alternate', hreflang: 'en', href: 'https://prosefly.com/docs/' },
      { rel: 'alternate', hreflang: 'zh-CN', href: 'https://prosefly.com/docs/zh-cn/' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://prosefly.com/docs/' },
    ]);
    expect(alternates.get('zh-cn/index')).toEqual(alternates.get('en/index'));
  });

  it('matches translations by content path while honoring their custom slugs', () => {
    const alternates = getDocsLanguageAlternates(config, [
      { id: 'en/installation', data: { slug: 'start/install' } },
      { id: 'zh-cn/installation', data: { slug: 'getting-started' } },
    ]);

    expect(alternates.get('en/installation')).toEqual([
      { lang: 'en', href: '/docs/start/install/' },
      { lang: 'zh-CN', href: '/docs/zh-cn/getting-started/' },
      { lang: 'x-default', href: '/docs/start/install/' },
    ]);
  });

  it('does not advertise missing translations or invent a default-language page', () => {
    const alternates = getDocsLanguageAlternates(config, [
      { id: 'en/overview', data: {} },
      { id: 'zh-cn/only-chinese', data: {} },
    ]);

    expect(alternates.get('en/overview')).toEqual([
      { lang: 'en', href: '/docs/overview/' },
      { lang: 'x-default', href: '/docs/overview/' },
    ]);
    expect(alternates.get('zh-cn/only-chinese')).toEqual([
      { lang: 'zh-CN', href: '/docs/zh-cn/only-chinese/' },
    ]);
  });

  it('uses the configured default locale and supports docs at the site root', () => {
    const rootConfig = resolveLotusConfig({
      ...config,
      docsBase: '/',
      defaultLocale: 'zh-cn',
    });
    const alternates = getDocsLanguageAlternates(rootConfig, [
      { id: 'en/index', data: {} },
      { id: 'zh-cn/index', data: {} },
    ]);

    expect(alternates.get('en/index')).toEqual([
      { lang: 'en', href: '/' },
      { lang: 'zh-CN', href: '/zh-cn/' },
      { lang: 'x-default', href: '/zh-cn/' },
    ]);
    expect(getDocsLanguageAlternates(resolveLotusConfig({}), [
      { id: 'index', data: {} },
    ]).size).toBe(0);
  });

  it('uses the route slash policy and omits language URLs without a site', () => {
    expect(getSeoUrl('/docs', site, '/docs/')).toBe('https://prosefly.com/docs/');
    expect(getSeoUrl('/docs/zh-cn/', site, '/docs')).toBe('https://prosefly.com/docs/zh-cn');
    expect(getSeoUrl('/docs/?utm_source=test#heading', site, '/docs/')).toBe('https://prosefly.com/docs/');
    expect(createLanguageAlternateHead([{ lang: 'en', href: '/docs/' }], undefined, '/docs/')).toEqual([]);
  });

  it('lets site and page head override generated metadata without duplicate tags', () => {
    const defaults: HeadConfig = [
      { tag: 'title', content: 'Installation - Lotus' },
      { tag: 'meta', attrs: { name: 'description', content: 'Install Lotus.' } },
      { tag: 'link', attrs: { rel: 'canonical', href: 'https://prosefly.com/docs/installation/' } },
      { tag: 'link', attrs: { rel: 'alternate', hreflang: 'en', href: 'https://prosefly.com/docs/installation/' } },
      { tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: '/docs/installation.md' } },
    ];
    const siteHead: HeadConfig = [
      { tag: 'link', attrs: { rel: 'canonical', href: 'https://prosefly.com/install/' } },
      { tag: 'meta', attrs: { property: 'og:type', content: 'article' } },
    ];
    const pageHead: HeadConfig = [
      { tag: 'title', content: 'Custom title' },
      { tag: 'meta', attrs: { name: 'description', content: 'Custom description' } },
      { tag: 'link', attrs: { rel: 'canonical', href: 'https://prosefly.com/custom/' } },
      { tag: 'link', attrs: { rel: 'alternate', hreflang: 'EN', href: 'https://prosefly.com/custom/' } },
      { tag: 'link', attrs: { rel: 'alternate', hreflang: 'zh-CN', href: 'https://prosefly.com/zh-cn/custom/' } },
      { tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: '/custom.md' } },
      { tag: 'meta', attrs: { property: 'og:title', content: 'Social title' } },
    ];
    const merged = createHead(defaults, siteHead, pageHead);
    const head = createHead(createOpenGraphHead(merged), merged);
    const og = Object.fromEntries(head.filter((entry) => entry.attrs?.property).map((entry) => [
      entry.attrs!.property, entry.attrs!.content,
    ]));

    expect(og).toEqual({
      'og:title': 'Social title',
      'og:description': 'Custom description',
      'og:url': 'https://prosefly.com/custom/',
      'og:type': 'article',
    });
    expect(head.filter((entry) => entry.attrs?.rel === 'canonical')).toHaveLength(1);
    expect(head.filter((entry) => String(entry.attrs?.hreflang).toLowerCase() === 'en')).toHaveLength(1);
    expect(head.filter((entry) => entry.attrs?.type === 'text/markdown')).toEqual([
      { tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: '/custom.md' } },
    ]);
    expect(head.filter((entry) => entry.attrs?.property === 'og:title')).toHaveLength(1);
  });

  it('generates Open Graph defaults without assuming a description or canonical URL', () => {
    expect(createOpenGraphHead([{ tag: 'title', content: 'Lotus' }])).toEqual([
      { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
      { tag: 'meta', attrs: { property: 'og:title', content: 'Lotus' } },
    ]);
  });
});
