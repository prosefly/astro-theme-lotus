import type { RemarkPlugin } from '@astrojs/markdown-remark';
import GithubSlugger from 'github-slugger';
import { mdastHeadingId } from 'mdast-heading-id';
import { micromarkHeadingId } from 'micromark-heading-id';

interface MdastNode {
  type: string;
  value?: unknown;
  children?: MdastNode[];
  data?: {
    hProperties?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

const VALID_HEADING_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._:-]*$/;

function isIdString(node: MdastNode): boolean {
  return node.type === 'idString' && typeof node.value === 'string';
}

function createTextNode(value: string): MdastNode {
  return {
    type: 'text',
    value,
  };
}

function getNodeText(node: MdastNode): string {
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value;
  }

  return (node.children ?? []).map(getNodeText).join('');
}

function trimTrailingText(children: MdastNode[]): void {
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index];

    if (child.type !== 'text' || typeof child.value !== 'string') {
      return;
    }

    const value = child.value.trimEnd();
    child.value = value;

    if (value.length > 0) {
      return;
    }

    children.splice(index, 1);
  }
}

function transformHeadingIds(node: MdastNode, slugger: GithubSlugger): void {
  const children = node.children;

  if (!children) {
    return;
  }

  for (const child of children) {
    transformHeadingIds(child, slugger);
  }

  if (node.type === 'heading') {
    const lastChild = children.at(-1);
    let id: string | undefined;

    if (lastChild && isIdString(lastChild)) {
      id = lastChild.value as string;

      if (!VALID_HEADING_ID_PATTERN.test(id)) {
        throw new Error(
          `Invalid custom heading id "{#${id}}". Use an ASCII letter followed by letters, numbers, ".", "_", ":" or "-".`,
        );
      }

      children.pop();
      trimTrailingText(children);
    } else {
      const text = getNodeText(node).trim();
      id = text ? slugger.slug(text) : undefined;
    }

    if (id && id !== 'footnote-label') {
      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          id,
        },
      };
    }
  }

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (isIdString(child)) {
      children[index] = createTextNode(`{#${child.value as string}}`);
    }
  }
}

export const remarkHeadingIds: RemarkPlugin = function () {
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };
  const micromarkExtensions = data.micromarkExtensions ?? (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);

  micromarkExtensions.push(micromarkHeadingId());
  fromMarkdownExtensions.push(mdastHeadingId());

  return (tree): void => {
    transformHeadingIds(tree as MdastNode, new GithubSlugger());
  };
};
