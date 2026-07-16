import { AstroError } from 'astro/errors';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';

type Node = ElementNode | TextNode | CommentNode;
type FileTreeKind = 'directory' | 'code' | 'config' | 'file' | 'image' | 'style' | 'text';

export interface FileTreeEntry {
  children: FileTreeEntry[];
  commentHtml: string;
  highlighted: boolean;
  isDirectory: boolean;
  isPlaceholder: boolean;
  kind: FileTreeKind;
  nameHtml: string;
  nameText: string;
}

interface TextNode {
  type: 'text';
  value: string;
}

interface CommentNode {
  type: 'comment';
  value: string;
}

interface ElementNode {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: Node[];
}

interface RootNode {
  children: Node[];
}

interface VFileLike {
  value: {
    toString(): string;
  };
}

const prettyPrintProcessor = rehype()
  .data('settings', { fragment: true })
  .use(rehypeFormat);

export function parseFileTree(html: string | undefined): FileTreeEntry[] {
  let entries: FileTreeEntry[] = [];
  const parseFileTreePlugin = () => (tree: RootNode, vfile: VFileLike) => {
    entries = parseFileTreeRoot(tree, vfile);
  };
  const processor = rehype()
    .data('settings', { fragment: true })
    .use(parseFileTreePlugin as never);

  processor.processSync({ value: html ?? '' });
  return entries;
}

function parseFileTreeRoot(tree: RootNode, vfile: VFileLike): FileTreeEntry[] {
  const rootElements = tree.children.filter(isElementNode);
  const [rootElement] = rootElements;

  if (!rootElement) {
    throwFileTreeError(
      'The `<FileTree>` component expects its content to be a single unordered list (`<ul>`) but found no child elements.'
    );
  }

  if (rootElements.length > 1) {
    throwFileTreeError(
      `The \`<FileTree>\` component expects its content to be a single unordered list (\`<ul>\`) but found multiple child elements: ${rootElements
        .map((element) => `\`<${element.tagName}>\``)
        .join(', ')}.`,
      vfile.value.toString()
    );
  }

  if (rootElement.tagName !== 'ul') {
    throwFileTreeError(
      `The \`<FileTree>\` component expects its content to be an unordered list (\`<ul>\`) but found the following element: \`<${rootElement.tagName}>\`.`,
      vfile.value.toString()
    );
  }

  if (!rootElement.children.some((child) => isElementNode(child) && child.tagName === 'li')) {
    throwFileTreeError(
      'The `<FileTree>` component expects its content to be an unordered list with at least one list item.',
      vfile.value.toString()
    );
  }

  return parseList(rootElement);
}

function parseList(list: ElementNode): FileTreeEntry[] {
  return list.children
    .filter((child): child is ElementNode => isElementNode(child) && child.tagName === 'li')
    .map(parseListItem);
}

function parseListItem(item: ElementNode): FileTreeEntry {
  const children = item.children.filter((child) => !isBlankTextNode(child));
  const nestedListIndex = children.findIndex(
    (child) => isElementNode(child) && child.tagName === 'ul'
  );
  const entryChildren =
    nestedListIndex === -1 ? children : children.slice(0, nestedListIndex);
  const nestedLists =
    nestedListIndex === -1
      ? []
      : children
          .slice(nestedListIndex)
          .filter((child): child is ElementNode => isElementNode(child) && child.tagName === 'ul');
  const entry = extractEntry(entryChildren);
  const nameText = getTextContent(entry.nameNode).trim();
  const isPlaceholder = /^(\.{3}|…)$/.test(nameText);
  const isDirectory = /\/\s*$/.test(nameText) || nestedLists.length > 0;
  const kind = isDirectory ? 'directory' : getFileKind(nameText);

  return {
    children: nestedLists.flatMap(parseList),
    commentHtml: toHtml(entry.commentNodes),
    highlighted: entry.highlighted,
    isDirectory,
    isPlaceholder,
    kind,
    nameHtml: toHtml([entry.nameNode]),
    nameText,
  };
}

function extractEntry(nodes: Node[]) {
  const normalizedNodes = unwrapParagraph(nodes);
  const [firstChild, ...restChildren] = normalizedNodes;
  let highlighted = false;
  let nameNode: Node = text('');
  let commentNodes: Node[] = [];

  if (isTextNode(firstChild)) {
    const match = firstChild.value.match(/^\s*(\S+)([\s\S]*)$/);

    if (match) {
      nameNode = text(match[1] ?? '');
      const textComment = (match[2] ?? '').trim();
      const firstCommentNode =
        textComment && restChildren.length > 0 ? text(`${textComment} `) : text(textComment);
      commentNodes = [firstCommentNode, ...restChildren].filter(
        (node) => !isBlankTextNode(node)
      );
    }
  } else if (isElementNode(firstChild)) {
    highlighted = firstChild.tagName === 'strong';
    nameNode = firstChild;
    commentNodes = restChildren.filter((node) => !isBlankTextNode(node));
  }

  return {
    commentNodes,
    highlighted,
    nameNode,
  };
}

function unwrapParagraph(nodes: Node[]): Node[] {
  if (nodes.length !== 1) {
    return nodes;
  }

  const [node] = nodes;

  if (!isElementNode(node) || node.tagName !== 'p') {
    return nodes;
  }

  return node.children;
}

function getFileKind(name: string): FileTreeKind {
  const normalizedName = name.trim().toLowerCase();

  if (/\.(astro|tsx?|jsx?|vue|svelte)$/.test(normalizedName)) return 'code';
  if (/\.(mdx?|txt|rst)$/.test(normalizedName)) return 'text';
  if (/\.(json|ya?ml|toml|config\.[cm]?js)$/.test(normalizedName)) return 'config';
  if (/\.(css|scss|sass|less)$/.test(normalizedName)) return 'style';
  if (/\.(png|jpe?g|gif|webp|svg|ico)$/.test(normalizedName)) return 'image';
  return 'file';
}

function toHtml(nodes: Node[]): string {
  return nodes.map(nodeToHtml).join('');
}

function nodeToHtml(node: Node): string {
  if (isTextNode(node)) return escapeHtml(node.value);
  if (isCommentNode(node)) return '';

  const attributes = propertiesToHtml(node.properties);
  const children = node.children.map(nodeToHtml).join('');

  return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
}

function propertiesToHtml(properties: Record<string, unknown>): string {
  return Object.entries(properties)
    .flatMap(([key, value]) => {
      if (value === undefined || value === null || value === false) return [];

      const attributeName = propertyNameToAttributeName(key);

      if (value === true) return [attributeName];
      if (Array.isArray(value)) return [`${attributeName}="${escapeAttribute(value.join(' '))}"`];

      return [`${attributeName}="${escapeAttribute(String(value))}"`];
    })
    .map((attribute) => ` ${attribute}`)
    .join('');
}

function propertyNameToAttributeName(name: string): string {
  if (name === 'className') return 'class';

  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function getTextContent(node: Node): string {
  if (isTextNode(node) || isCommentNode(node)) return node.value;
  if (isElementNode(node)) return node.children.map(getTextContent).join('');
  return '';
}

function isBlankTextNode(node: Node): node is TextNode {
  return isTextNode(node) && /^\s*$/.test(node.value);
}

function isTextNode(node: unknown): node is TextNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'text' &&
    'value' in node
  );
}

function isCommentNode(node: unknown): node is CommentNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'comment' &&
    'value' in node
  );
}

function isElementNode(node: unknown): node is ElementNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'element' &&
    'tagName' in node &&
    'properties' in node &&
    'children' in node
  );
}

function text(value: string): TextNode {
  return {
    type: 'text',
    value,
  };
}

function throwFileTreeError(message: string, html?: string): never {
  throw new AstroError(
    message,
    'Use the same syntax as Starlight: wrap a single Markdown unordered list in `<FileTree>...</FileTree>`.' +
      (html
        ? `\n\nFull rendered content:\n\n${prettyPrintProcessor
            .processSync({ value: html })
            .toString()}`
        : '')
  );
}
