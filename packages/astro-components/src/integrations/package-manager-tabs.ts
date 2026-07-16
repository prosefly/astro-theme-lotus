import type { RemarkPlugin } from '@astrojs/markdown-remark';

const importStatement =
  "import { Tabs as LotusPackageManagerTabs, TabItem as LotusPackageManagerTabItem } from '@prosefly/astro-components';";

const shellLanguages = new Set([
  'bash',
  'console',
  'sh',
  'shell',
  'terminal',
  'zsh',
]);

const nodePackageManagers = [
  { icon: 'simple-icons:pnpm', label: 'pnpm' },
  { icon: 'simple-icons:npm', label: 'npm' },
  { icon: 'simple-icons:yarn', label: 'yarn' },
  { icon: 'simple-icons:bun', label: 'bun' },
] as const;

const pythonPackageManagers = [
  { icon: 'simple-icons:pypi', label: 'pip' },
  { icon: 'simple-icons:uv', label: 'uv' },
  { icon: 'simple-icons:poetry', label: 'poetry' },
  { icon: 'simple-icons:pdm', label: 'pdm' },
] as const;

interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  [key: string]: unknown;
}

interface CodeNode extends MarkdownNode {
  lang?: string;
  meta?: string;
  type: 'code';
  value: string;
}

interface RootNode extends MarkdownNode {
  children: MarkdownNode[];
}

interface PackageManagerTab {
  icon: string;
  label: string;
}

interface PackageManagerTabGroup {
  managers: readonly PackageManagerTab[];
  syncKey: string;
}

interface LineVariants {
  group: PackageManagerTabGroup;
  variants: Record<string, string>;
}

export const remarkPackageManagerTabs: RemarkPlugin = () => {
  return (tree) => {
    const root = tree as RootNode;
    let transformed = false;

    visitChildren(root, (node, parent, index, ancestors) => {
      if (!parent || index === undefined || !isCodeNode(node)) {
        return;
      }

      if ((ancestors ?? []).some(isMdxComponentNode)) {
        return;
      }

      const variantGroup = getPackageManagerVariants(node);

      if (!variantGroup) {
        return;
      }

      if (!parent.children) {
        return;
      }

      parent.children[index] = createTabsNode(node, variantGroup);
      transformed = true;
    });

    if (transformed && !hasPackageManagerTabsImport(root)) {
      root.children.unshift(createImportNode());
    }
  };
};

function visitChildren(
  node: MarkdownNode,
  visitor: (
    node: MarkdownNode,
    parent?: MarkdownNode,
    index?: number,
    ancestors?: MarkdownNode[],
  ) => void,
  parent?: MarkdownNode,
  index?: number,
  ancestors: MarkdownNode[] = [],
): void {
  visitor(node, parent, index, ancestors);

  if (!node.children) {
    return;
  }

  node.children.forEach((child, childIndex) => {
    visitChildren(child, visitor, node, childIndex, [...ancestors, node]);
  });
}

function isCodeNode(node: MarkdownNode): node is CodeNode {
  return node.type === 'code' && typeof node.value === 'string';
}

function isMdxComponentNode(node: MarkdownNode): boolean {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function getPackageManagerVariants(
  node: CodeNode,
): { group: PackageManagerTabGroup; lines: Record<string, string>[] } | undefined {
  if (node.lang && !shellLanguages.has(node.lang)) {
    return undefined;
  }

  const lines = node.value.split('\n');
  const variants = lines.map(getLineVariants);
  const commands = variants.filter((line): line is { kind: 'command'; variants: LineVariants } =>
    line?.kind === 'command'
  );

  if (variants.some((line) => line === undefined)) {
    return undefined;
  }

  if (commands.length === 0) {
    return undefined;
  }

  const group = commands[0]?.variants.group;

  if (!group || commands.some((line) => line.variants.group !== group)) {
    return undefined;
  }

  return {
    group,
    lines: variants.map((line) =>
      line?.kind === 'command' ? line.variants.variants : createEmptyLineVariants(group)
    ),
  };
}

function getLineVariants(
  line: string,
): { kind: 'command'; variants: LineVariants } | { kind: 'empty' } | undefined {
  if (line.trim().length === 0) {
    return { kind: 'empty' };
  }

  const indentation = line.match(/^\s*/)?.[0] ?? '';
  const command = line.trim();

  if (command.startsWith('$ ')) {
    const variants = getCommandVariants(command.slice(2));
    return variants
      ? { kind: 'command', variants: prefixVariants(variants, `${indentation}$ `) }
      : undefined;
  }

  const variants = getCommandVariants(command);
  return variants
    ? { kind: 'command', variants: prefixVariants(variants, indentation) }
    : undefined;
}

function getCommandVariants(command: string): LineVariants | undefined {
  return getNodeCommandVariants(command) ?? getPythonCommandVariants(command);
}

function getNodeCommandVariants(command: string): LineVariants | undefined {
  const installMatch = command.match(/^npm\s+(?:install|i|add)(?:\s+(.*))?$/);

  if (installMatch) {
    const dependencies = installMatch[1]?.trim() ?? '';

    if (!dependencies) {
      return createLineVariants(nodePackageManagerTabs, {
        bun: 'bun install',
        npm: 'npm install',
        pnpm: 'pnpm install',
        yarn: 'yarn install',
      });
    }

    return createLineVariants(nodePackageManagerTabs, {
      bun: `bun add ${normalizeDependencyArgs(dependencies, 'bun')}`,
      npm: `npm install ${dependencies}`,
      pnpm: `pnpm add ${normalizeDependencyArgs(dependencies, 'pnpm')}`,
      yarn: `yarn add ${normalizeDependencyArgs(dependencies, 'yarn')}`,
    });
  }

  const runMatch = command.match(/^npm\s+run\s+([^\s]+)(.*)$/);

  if (runMatch) {
    const scriptName = runMatch[1];
    const args = runMatch[2]?.trimEnd() ?? '';

    return createLineVariants(nodePackageManagerTabs, {
      bun: `bun ${scriptName}${args}`,
      npm: command,
      pnpm: `pnpm ${scriptName}${args}`,
      yarn: `yarn ${scriptName}${args}`,
    });
  }

  const createMatch = command.match(/^npm\s+create\s+([^\s]+)(.*)$/);

  if (createMatch) {
    const initializer = createMatch[1];
    const args = createMatch[2]?.trimEnd() ?? '';

    return createLineVariants(nodePackageManagerTabs, {
      bun: `bun create ${initializer}${args}`,
      npm: command,
      pnpm: `pnpm create ${initializer}${args}`,
      yarn: `yarn create ${initializer}${args}`,
    });
  }

  const dlxMatch = command.match(/^(?:npx|npm\s+dlx)\s+(.+)$/);

  if (dlxMatch) {
    const executable = dlxMatch[1].trim();

    return createLineVariants(nodePackageManagerTabs, {
      bun: `bunx --bun ${executable}`,
      npm: command,
      pnpm: `pnpm dlx ${executable}`,
      yarn: `yarn dlx ${executable}`,
    });
  }

  return undefined;
}

function getPythonCommandVariants(command: string): LineVariants | undefined {
  const pipInstallMatch = command.match(/^(?:(?:python|python3)\s+-m\s+)?pip\s+install(?:\s+(.*))?$/);
  const uvPipInstallMatch = command.match(/^uv\s+pip\s+install(?:\s+(.*))?$/);
  const uvAddMatch = command.match(/^uv\s+add(?:\s+(.*))?$/);
  const poetryAddMatch = command.match(/^poetry\s+add(?:\s+(.*))?$/);
  const pdmAddMatch = command.match(/^pdm\s+add(?:\s+(.*))?$/);
  const dependencies = (
    pipInstallMatch?.[1] ??
    uvPipInstallMatch?.[1] ??
    uvAddMatch?.[1] ??
    poetryAddMatch?.[1] ??
    pdmAddMatch?.[1] ??
    ''
  ).trim();

  if (!pipInstallMatch && !uvPipInstallMatch && !uvAddMatch && !poetryAddMatch && !pdmAddMatch) {
    return undefined;
  }

  return createLineVariants(pythonPackageManagerTabs, {
    pip: dependencies ? `pip install ${dependencies}` : 'pip install',
    uv: dependencies ? `uv add ${dependencies}` : 'uv pip install',
    poetry: dependencies ? `poetry add ${dependencies}` : 'poetry install',
    pdm: dependencies ? `pdm add ${dependencies}` : 'pdm install',
  });
}

function normalizeDependencyArgs(
  dependencies: string,
  packageManager: 'bun' | 'pnpm' | 'yarn',
): string {
  const devFlag = packageManager === 'bun' ? '-d' : '-D';
  const hasDevFlag = /(^|\s)(?:--save-dev|--dev|-D)(?=\s|$)/.test(dependencies);
  const normalized = dependencies
    .replace(/(^|\s)(?:--save-dev|--dev|-D)(?=\s|$)/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  return hasDevFlag ? `${devFlag} ${normalized}` : normalized;
}

function createLineVariants(
  group: PackageManagerTabGroup,
  variants: Record<string, string>,
): LineVariants {
  return { group, variants };
}

function prefixVariants(line: LineVariants, prefix: string): LineVariants {
  return {
    group: line.group,
    variants: Object.fromEntries(
      Object.entries(line.variants).map(([label, command]) => [label, `${prefix}${command}`]),
    ),
  };
}

function createImportNode(): MarkdownNode {
  return {
    type: 'mdxjsEsm',
    value: importStatement,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportSpecifier',
                imported: { type: 'Identifier', name: 'Tabs' },
                local: { type: 'Identifier', name: 'LotusPackageManagerTabs' },
              },
              {
                type: 'ImportSpecifier',
                imported: { type: 'Identifier', name: 'TabItem' },
                local: { type: 'Identifier', name: 'LotusPackageManagerTabItem' },
              },
            ],
            source: {
              type: 'Literal',
              value: '@prosefly/astro-components',
              raw: "'@prosefly/astro-components'",
            },
          },
        ],
      },
    },
  };
}

function hasPackageManagerTabsImport(tree: RootNode): boolean {
  return tree.children.some(
    (node) =>
      node.type === 'mdxjsEsm' &&
      typeof node.value === 'string' &&
      node.value.includes('LotusPackageManagerTabs'),
  );
}

function createEmptyLineVariants(group: PackageManagerTabGroup): Record<string, string> {
  return Object.fromEntries(group.managers.map((manager) => [manager.label, '']));
}

function createTabsNode(
  sourceNode: CodeNode,
  variantGroup: { group: PackageManagerTabGroup; lines: Record<string, string>[] },
): MarkdownNode {
  const valueByPackageManager = Object.fromEntries(
    variantGroup.group.managers.map((manager) => [
      manager.label,
      variantGroup.lines.map((line) => line[manager.label]).join('\n'),
    ]),
  );

  return {
    type: 'mdxJsxFlowElement',
    name: 'LotusPackageManagerTabs',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'copy',
        value: null,
      },
      {
        type: 'mdxJsxAttribute',
        name: 'syncKey',
        value: variantGroup.group.syncKey,
      },
    ],
    children: variantGroup.group.managers.map((manager) => ({
      type: 'mdxJsxFlowElement',
      name: 'LotusPackageManagerTabItem',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'label',
          value: manager.label,
        },
        {
          type: 'mdxJsxAttribute',
          name: 'icon',
          value: manager.icon,
        },
      ],
      children: [
        createPackageManagerCodeElement(
          valueByPackageManager[manager.label] ?? '',
          sourceNode.lang ?? 'sh',
        ),
      ],
    })),
  };
}

function createPackageManagerCodeElement(code: string, language: string): MarkdownNode {
  // Use JSX elements instead of an mdast `code` node so Expressive Code does
  // not transform package-manager tab contents.
  return {
    type: 'mdxJsxFlowElement',
    name: 'figure',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'className',
        value: 'pl-package-manager-code',
      },
      {
        type: 'mdxJsxAttribute',
        name: 'data-language',
        value: language,
      },
    ],
    children: [
      {
        type: 'mdxJsxFlowElement',
        name: 'pre',
        attributes: [],
        children: [
          {
            type: 'mdxJsxTextElement',
            name: 'code',
            attributes: [],
            children: [
              {
                type: 'text',
                value: code,
              },
            ],
          },
        ],
      },
    ],
  };
}

const nodePackageManagerTabs = {
  managers: nodePackageManagers,
  syncKey: 'package-manager',
} satisfies PackageManagerTabGroup;

const pythonPackageManagerTabs = {
  managers: pythonPackageManagers,
  syncKey: 'python-package-manager',
} satisfies PackageManagerTabGroup;
