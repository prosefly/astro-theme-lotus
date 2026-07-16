import { AstroError } from 'astro/errors';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';

type Node = ElementNode | TextNode | CommentNode;

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

const fileTreeProcessor = rehype()
  .data('settings', { fragment: true })
  .use(processFileTreeRoot as never);

export function processFileTree(html: string | undefined): string {
  const file = fileTreeProcessor.processSync({ value: html ?? '' });

  return file.toString();
}

function processFileTreeRoot() {
  return (tree: RootNode, vfile: VFileLike) => {
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

    processList(rootElement, true);
  };
}

function processList(list: ElementNode, isRoot = false): void {
  list.properties.role = 'list';
  list.properties.className = appendClassName(
    list.properties.className,
    isRoot ? 'pl-file-tree' : 'pl-file-tree__list'
  );
  list.children = list.children.filter((child) => !isBlankTextNode(child));

  for (const child of list.children) {
    if (isElementNode(child) && child.tagName === 'li') {
      processListItem(child);
    }
  }
}

function processListItem(item: ElementNode): void {
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
  const fileName = getTextContent(entry.nameNode).trim();
  const isPlaceholder = /^(\.{3}|…)$/.test(fileName);
  const isDirectory = /\/\s*$/.test(fileName) || nestedLists.length > 0;

  item.properties.className = [
    'pl-file-tree__item',
    isDirectory ? 'pl-file-tree__item--directory' : 'pl-file-tree__item--file',
    isPlaceholder ? 'pl-file-tree__item--placeholder' : '',
    entry.highlighted ? 'pl-file-tree__item--highlighted' : '',
  ].filter(Boolean);

  const treeEntry = createTreeEntry({
    commentNodes: entry.commentNodes,
    highlighted: entry.highlighted,
    isDirectory,
    isPlaceholder,
    nameNode: entry.nameNode,
  });

  if (!isDirectory) {
    item.children = [treeEntry];
    return;
  }

  for (const nestedList of nestedLists) {
    processList(nestedList);
  }

  const hasContents = nestedLists.length > 0;
  const detailsChildren: Node[] = [
    element('summary', { className: ['pl-file-tree__summary'] }, [treeEntry]),
    ...(hasContents ? nestedLists : [createPlaceholderList()]),
  ];

  item.children = [
    element(
      'details',
      {
        className: ['pl-file-tree__details'],
        open: hasContents ? true : undefined,
      },
      detailsChildren
    ),
  ];
}

function extractEntry(nodes: Node[]) {
  const [firstChild, ...restChildren] = nodes;
  let highlighted = false;
  let nameNode: Node = text('');
  let commentNodes: Node[] = [];

  if (isTextNode(firstChild)) {
    const match = firstChild.value.match(/^(\S+)([\s\S]*)$/);

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

function createTreeEntry(options: {
  commentNodes: Node[];
  highlighted: boolean;
  isDirectory: boolean;
  isPlaceholder: boolean;
  nameNode: Node;
}) {
  const nameChildren: Node[] = [];

  if (options.isDirectory && !options.isPlaceholder) {
    nameChildren.push(
      element('span', { className: ['pl-file-tree__sr-only'] }, [text('Directory ')])
    );
  }

  nameChildren.push(options.nameNode);

  const children: Node[] = [
    ...(options.isDirectory && !options.isPlaceholder ? [createChevron()] : []),
    ...(options.isPlaceholder
      ? []
      : [createIcon(options.isDirectory ? 'directory' : getFileKind(options.nameNode))]),
    element(
      'span',
      {
        className: [
          'pl-file-tree__name',
          options.highlighted ? 'pl-file-tree__name--highlighted' : '',
        ].filter(Boolean),
      },
      nameChildren
    ),
  ];

  const commentNodes = options.commentNodes.filter((node) => !isBlankTextNode(node));

  if (commentNodes.length > 0) {
    children.push(
      text(' '),
      element('span', { className: ['pl-file-tree__comment'] }, commentNodes)
    );
  }

  return element('span', { className: ['pl-file-tree__entry'] }, children);
}

function createPlaceholderList() {
  const item = element('li', {}, [text('…')]);
  const list = element('ul', {}, [item]);

  processList(list);
  return list;
}

function createIcon(kind: string) {
  return element(
    'span',
    {
      'aria-hidden': 'true',
      className: ['pl-file-tree__icon'],
      dataKind: kind,
    },
    [kind === 'directory' ? folderSvg() : fileSvg()]
  );
}

function createChevron() {
  return element('span', { 'aria-hidden': 'true', className: ['pl-file-tree__chevron'] }, [
    element(
      'svg',
      {
        fill: 'none',
        height: 16,
        viewBox: '0 0 24 24',
        width: 16,
      },
      [
        element('path', {
          d: 'm9 18 6-6-6-6',
          stroke: 'currentColor',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
        }),
      ]
    ),
  ]);
}

function folderSvg() {
  return element(
    'svg',
    {
      fill: 'none',
      height: 16,
      viewBox: '0 0 24 24',
      width: 16,
    },
    [
      element('path', {
        d: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v6.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 1.8,
      }),
    ]
  );
}

function fileSvg() {
  return element(
    'svg',
    {
      fill: 'none',
      height: 16,
      viewBox: '0 0 24 24',
      width: 16,
    },
    [
      element('path', {
        d: 'M14 3v5a1 1 0 0 0 1 1h5',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 1.8,
      }),
      element('path', {
        d: 'M6 3h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 1.8,
      }),
    ]
  );
}

function getFileKind(nameNode: Node) {
  const name = getTextContent(nameNode).trim().toLowerCase();

  if (/\.(astro|tsx?|jsx?|vue|svelte)$/.test(name)) return 'code';
  if (/\.(mdx?|txt|rst)$/.test(name)) return 'text';
  if (/\.(json|ya?ml|toml|config\.[cm]?js)$/.test(name)) return 'config';
  if (/\.(css|scss|sass|less)$/.test(name)) return 'style';
  if (/\.(png|jpe?g|gif|webp|svg|ico)$/.test(name)) return 'image';
  return 'file';
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

function element(tagName: string, properties: Record<string, unknown> = {}, children: Node[] = []) {
  return {
    type: 'element' as const,
    tagName,
    properties,
    children,
  };
}

function text(value: string): TextNode {
  return {
    type: 'text',
    value,
  };
}

function appendClassName(className: unknown, name: string) {
  if (Array.isArray(className)) return [...className, name];
  if (typeof className === 'string') return [className, name];
  return [name];
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
