import { describe, expect, it } from 'vitest';
import type { AstroConfig } from 'astro';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough/parseOnly';
import { resolveMarkdownConfig } from '../src/lib/config/markdown';
import { remarkHeadingIds } from '../src/lib/markdown/heading-ids';

interface TestNode {
  type: string;
  value?: string;
  children?: TestNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
}

function runHeadingIds(tree: TestNode) {
  const data: Record<string, unknown[]> = {};
  const processor = {
    data() {
      return data;
    },
  };
  const transformer = remarkHeadingIds.call(processor as never);

  transformer?.(tree as never, undefined as never, () => undefined);
  return tree;
}

function heading(children: TestNode[]): TestNode {
  return {
    type: 'heading',
    children,
  };
}

function text(value: string): TestNode {
  return {
    type: 'text',
    value,
  };
}

function markdownConfig(config: Partial<AstroConfig['markdown']> = {}): AstroConfig['markdown'] {
  return config as AstroConfig['markdown'];
}

describe('markdown transforms', () => {
  it('enables CJK friendly parsing automatically for CJK locales', () => {
    const config = resolveMarkdownConfig({
      locales: {
        root: { label: 'English', directory: 'en' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN', directory: 'zh-cn' },
      },
    }, markdownConfig());
    const plugins = config.processor.options.remarkPlugins;

    expect(plugins).toContain(remarkCjkFriendly);
    expect(plugins).toContain(remarkCjkFriendlyGfmStrikethrough);
  });

  it('can disable CJK friendly parsing and respects disabled GFM', () => {
    const disabled = resolveMarkdownConfig({
      locales: {
        ja: { label: 'Japanese', lang: 'ja', directory: 'ja' },
      },
      markdown: {
        cjkFriendly: false,
      },
    }, markdownConfig());

    expect(disabled.processor.options.remarkPlugins).not.toContain(remarkCjkFriendly);
    expect(disabled.processor.options.remarkPlugins).not.toContain(remarkCjkFriendlyGfmStrikethrough);

    const withoutGfm = resolveMarkdownConfig({
      markdown: {
        cjkFriendly: true,
      },
    }, markdownConfig({
      gfm: false,
    }));

    expect(withoutGfm.processor.options.remarkPlugins).toContain(remarkCjkFriendly);
    expect(withoutGfm.processor.options.remarkPlugins).not.toContain(remarkCjkFriendlyGfmStrikethrough);
  });

  it('generates stable slugs for headings and duplicate headings', () => {
    const tree = runHeadingIds({
      type: 'root',
      children: [
        heading([text('Hello World')]),
        heading([text('Hello World')]),
      ],
    });

    expect(tree.children?.[0].data?.hProperties?.id).toBe('hello-world');
    expect(tree.children?.[1].data?.hProperties?.id).toBe('hello-world-1');
  });

  it('supports custom heading ids and removes the marker text', () => {
    const tree = runHeadingIds({
      type: 'root',
      children: [
        heading([
          text('Install Lotus '),
          { type: 'idString', value: 'install-lotus' },
        ]),
      ],
    });

    expect(tree.children?.[0].data?.hProperties?.id).toBe('install-lotus');
    expect(tree.children?.[0].children).toEqual([text('Install Lotus')]);
  });

  it('keeps inline id markers as text outside headings', () => {
    const tree = runHeadingIds({
      type: 'paragraph',
      children: [{ type: 'idString', value: 'not-a-heading' }],
    });

    expect(tree.children).toEqual([text('{#not-a-heading}')]);
  });

  it('rejects invalid custom heading ids', () => {
    expect(() =>
      runHeadingIds({
        type: 'root',
        children: [heading([{ type: 'idString', value: '123 invalid' }])],
      }),
    ).toThrow('Invalid custom heading id');
  });
});
