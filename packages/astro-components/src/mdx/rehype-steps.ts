import { AstroError } from 'astro/errors';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';

interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
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

const stepsProcessor = rehype()
  .data('settings', { fragment: true })
  .use(processStepsTree as never);

export function processSteps(html: string | undefined) {
  const file = stepsProcessor.processSync({ value: html ?? '' });

  return {
    html: file.toString(),
  };
}

function processStepsTree() {
  return (tree: HastRoot, vfile: VFileLike) => {
    const rootElements = tree.children.filter(isRootElement);
    const [rootElement] = rootElements;

    if (!rootElement) {
      throw new StepsError(
        'The `<Steps>` component expects its content to be a single ordered list (`<ol>`) but found no child elements.'
      );
    }

    if (rootElements.length > 1) {
      throw new StepsError(
        `The \`<Steps>\` component expects its content to be a single ordered list (\`<ol>\`) but found multiple child elements: ${rootElements
          .map((element) => `\`<${element.tagName}>\``)
          .join(', ')}.`,
        vfile.value.toString()
      );
    }

    if (rootElement.tagName !== 'ol') {
      throw new StepsError(
        `The \`<Steps>\` component expects its content to be a single ordered list (\`<ol>\`) but found the following element: \`<${rootElement.tagName}>\`.`,
        vfile.value.toString()
      );
    }

    rootElement.properties.role = 'list';
    rootElement.properties.className = appendClassName(
      rootElement.properties.className,
      'pl-steps'
    );

    const start = getNumericStart(rootElement.properties.start);
    if (Number.isFinite(start)) {
      const styles = [`--pl-steps-start: ${start - 1}`];
      if (rootElement.properties.style) {
        styles.push(String(rootElement.properties.style));
      }
      rootElement.properties.style = styles.join(';');
    }
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

function appendClassName(className: unknown, name: string) {
  if (Array.isArray(className)) return [...className, name];
  if (typeof className === 'string') return [className, name];
  return [name];
}

function getNumericStart(start: unknown) {
  if (typeof start === 'number') return start;
  if (typeof start === 'string') return Number.parseInt(start, 10);
  return Number.NaN;
}

class StepsError extends AstroError {
  constructor(message: string, html?: string) {
    super(
      message,
      'Use the same syntax as Starlight: wrap a single Markdown ordered list in `<Steps>...</Steps>`.' +
        (html ? `\n\nFull rendered content:\n\n${prettyPrintHtml(html)}` : '')
    );

    this.name = 'StepsError';
  }
}
