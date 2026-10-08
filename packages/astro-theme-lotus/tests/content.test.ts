import { describe, expect, it, vi } from 'vitest';
import { glob } from 'astro/loaders';
import { docsLoader, docsSchema } from '../src/content';

vi.mock('astro/loaders', () => ({ glob: vi.fn() }));

describe('docs loader', () => {
  it('preserves language directories and file identity when a page has a custom slug', () => {
    docsLoader({ base: './content/manual', pattern: '**/*.{md,mdx}' });
    const options = vi.mocked(glob).mock.calls.at(-1)![0];
    const generateId = options.generateId!;
    const base = new URL('file:///project/content/manual/');

    expect(options.base).toBe('./content/manual');
    expect(options.pattern).toBe('**/*.{md,mdx}');
    expect(generateId({ entry: 'en/installation.mdx', base, data: { slug: 'start/install' } }))
      .toBe('en/installation');
    expect(generateId({ entry: 'zh-cn/installation.mdx', base, data: { slug: 'getting-started' } }))
      .toBe('zh-cn/installation');
    expect(generateId({ entry: 'en/index.mdx', base, data: {} })).toBe('en');
    expect(generateId({ entry: 'A Guide/First Steps.md', base, data: {} })).toBe('a-guide/first-steps');
  });
});

describe('docs content schema', () => {
  it('accepts a sidebar icon', () => {
    const schema = docsSchema()({} as never);

    expect(schema.parse({
      title: 'Badge',
      sidebar: {
        icon: 'lucide:badge',
      },
    })).toMatchObject({
      title: 'Badge',
      sidebar: {
        icon: 'lucide:badge',
      },
    });
  });
});
