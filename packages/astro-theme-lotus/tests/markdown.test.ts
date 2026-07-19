import { describe, expect, it } from 'vitest';
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

describe('markdown transforms', () => {
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
