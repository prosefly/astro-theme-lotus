import { AstroError } from 'astro/errors';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';

export const TabItemTagName = 'prosefly-tab-item';

export interface TabPanel {
  icon?: string;
  label: string;
  panelId: string;
  tabId: string;
  value: string;
}

interface ProcessPanelsOptions {
  defaultValue?: string;
  idPrefix: string;
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children?: unknown[];
}

interface HastRoot {
  children: unknown[];
}

interface VFileLike {
  value: {
    toString(): string;
  };
}

const prettyPrintProcessor = rehype()
  .data('settings', { fragment: true })
  .use(rehypeFormat);

const prettyPrintHtml = (html: string) =>
  prettyPrintProcessor.processSync({ value: html }).toString();

export function processPanels(html: string | undefined, options: ProcessPanelsOptions) {
  const panels: TabPanel[] = [];
  let activeIndex = 0;

  const processTabsTree = () => {
    return (tree: HastRoot, vfile: VFileLike) => {
        const rootElements = tree.children.filter(isRootElement);
        const invalidRootElements = rootElements.filter(
          (element) => element.tagName !== TabItemTagName
        );

        if (invalidRootElements.length > 0) {
          throw new TabsError(
            `The \`<Tabs>\` component expects only \`<TabItem>\` children but found: ${invalidRootElements
              .map((element) => `\`<${element.tagName}>\``)
              .join(', ')}.`,
            vfile.value.toString()
          );
        }

        if (rootElements.length === 0) {
          throw new TabsError(
            'The `<Tabs>` component expects at least one `<TabItem>` child.'
          );
        }

        const panelElements = rootElements.map((tabElement, index) => {
          const label = getPropertyString(tabElement.properties.dataLabel);

          if (!label) {
            throw new TabsError(
              'Missing prop `label` on `<TabItem>`.',
              vfile.value.toString()
            );
          }

          const value = getPropertyString(tabElement.properties.dataValue) ?? label;
          const panelId = `${options.idPrefix}-panel-${index}`;
          const tabId = `${options.idPrefix}-tab-${index}`;
          const icon = getPropertyString(tabElement.properties.dataIcon);
          const isActive =
            options.defaultValue !== undefined
              ? options.defaultValue === label || options.defaultValue === value
              : index === 0;

          if (isActive) {
            activeIndex = index;
          }

          panels.push({
            icon,
            label,
            panelId,
            tabId,
            value,
          });

          return {
            type: 'element',
            tagName: 'div',
            properties: {
              'aria-labelledby': tabId,
              className: ['pl-tabs__panel'],
              hidden: isActive ? undefined : true,
              id: panelId,
              role: 'tabpanel',
              tabIndex: hasFocusableElement(tabElement.children ?? []) ? undefined : 0,
            },
            children: tabElement.children ?? [],
          };
        });

        if (options.defaultValue !== undefined && panels[activeIndex]?.value !== options.defaultValue) {
          panelElements.forEach((panel, index) => {
            panel.properties.hidden = index === 0 ? undefined : true;
          });
        }

        tree.children = panelElements;
      };
  };

  const processor = rehype()
    .data('settings', { fragment: true })
    .use(processTabsTree as never);

  const file = processor.processSync({ value: html ?? '' });

  return {
    activeIndex,
    html: file.toString(),
    panels,
  };
}

function isRootElement(node: unknown): node is HastElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'element' &&
    'tagName' in node &&
    node.tagName !== 'script' &&
    'properties' in node
  );
}

function getPropertyString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function hasFocusableElement(nodes: unknown[]): boolean {
  for (const node of nodes) {
    if (!isRootElement(node)) continue;

    if (isFocusableElement(node)) return true;
    if (hasFocusableElement(node.children ?? [])) return true;
  }

  return false;
}

function isFocusableElement(element: HastElement): boolean {
  if (element.properties.hidden) return false;
  if (element.properties.disabled) return false;
  if (element.properties.tabIndex !== undefined) return Number(element.properties.tabIndex) >= 0;

  if (element.tagName === 'a') return Boolean(element.properties.href);
  if (['button', 'input', 'select', 'textarea'].includes(element.tagName)) return true;
  if (['audio', 'video'].includes(element.tagName)) return Boolean(element.properties.controls);

  return false;
}

class TabsError extends AstroError {
  constructor(message: string, html?: string) {
    super(
      message,
      'Use the same syntax as Starlight: wrap one or more `<TabItem label="...">...</TabItem>` children in `<Tabs>...</Tabs>`.' +
        (html ? `\n\nFull rendered content:\n\n${prettyPrintHtml(html)}` : '')
    );

    this.name = 'TabsError';
  }
}
