import GithubSlugger from 'github-slugger';

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface HastRoot {
  type: 'root';
  children?: HastNode[];
}

interface HastText {
  type: 'text';
  value: string;
}

type HastNode = HastElement | HastRoot | HastText | { type: string; children?: HastNode[] };

const ANCHORED_HEADINGS = new Set(['h2', 'h3', 'h4']);
const SLUGGED_HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function isElement(node: HastNode): node is HastElement {
  return node.type === 'element' && typeof (node as HastElement).tagName === 'string';
}

function visitElements(node: HastNode, callback: (element: HastElement) => void): void {
  if (isElement(node)) {
    callback(node);
  }

  const children = 'children' in node && Array.isArray(node.children) ? node.children : undefined;

  for (const child of children ?? []) {
    visitElements(child, callback);
  }
}

function getNodeText(node: HastNode): string {
  if (node.type === 'text' && 'value' in node && typeof node.value === 'string') {
    return node.value;
  }

  const children = 'children' in node && Array.isArray(node.children) ? node.children : undefined;
  return (children ?? []).map(getNodeText).join('');
}

function hasHeadingAnchor(element: HastElement): boolean {
  return (element.children ?? []).some((child) => {
    if (!isElement(child) || child.tagName !== 'a') {
      return false;
    }

    const className = child.properties?.className;
    return Array.isArray(className) && className.includes('lotus-heading-anchor');
  });
}

function createHeadingAnchor(slug: string): HastElement {
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      ariaLabel: 'Link to this section',
      className: ['lotus-heading-anchor'],
      href: `#${slug}`,
    },
    children: [
      {
        type: 'element',
        tagName: 'svg',
        properties: {
          ariaHidden: 'true',
          className: ['lotus-heading-anchor__icon'],
          fill: 'none',
          height: 16,
          stroke: 'currentColor',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          viewBox: '0 0 24 24',
          width: 16,
          xmlns: 'http://www.w3.org/2000/svg',
        },
        children: [
          {
            type: 'element',
            tagName: 'path',
            properties: {
              d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
            },
            children: [],
          },
          {
            type: 'element',
            tagName: 'path',
            properties: {
              d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
            },
            children: [],
          },
        ],
      },
    ],
  };
}

export function rehypeHeadingAnchors() {
  return (tree: HastRoot): void => {
    const slugger = new GithubSlugger();

    visitElements(tree, (element) => {
      if (!SLUGGED_HEADINGS.has(element.tagName)) {
        return;
      }

      const text = getNodeText(element).trim();
      const existingSlug = element.properties?.id;
      const generatedSlug = text ? slugger.slug(text) : undefined;
      const slug = typeof existingSlug === 'string' && existingSlug.length > 0
        ? existingSlug
        : generatedSlug;

      if (!slug || slug === 'footnote-label') {
        return;
      }

      element.properties = {
        ...element.properties,
        id: slug,
      };

      if (!ANCHORED_HEADINGS.has(element.tagName)) {
        return;
      }

      if (hasHeadingAnchor(element)) {
        return;
      }

      element.children = [createHeadingAnchor(slug), ...(element.children ?? [])];
    });
  };
}
