import type { RehypePlugin } from '@astrojs/markdown-remark';

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  [key: string]: unknown;
}

interface ElementNode extends HastNode {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}

export const rehypeImageGallery: RehypePlugin = () => {
  return (tree) => {
    visitChildren(tree as HastNode);
  };
};

function visitChildren(node: HastNode): void {
  if (!node.children) {
    return;
  }

  node.children = node.children.map((child) => {
    if (isParagraphElement(child)) {
      const images = getOnlyImageChildren(child);

      if (images) {
        return createImageGallery(images);
      }
    }

    visitChildren(child);
    return child;
  });
}

function isParagraphElement(node: HastNode): node is ElementNode {
  return node.type === 'element' && node.tagName === 'p' && Array.isArray(node.children);
}

function isImageElement(node: HastNode): node is ElementNode {
  return node.type === 'element' && node.tagName === 'img';
}

function isWhitespaceText(node: HastNode): boolean {
  return node.type === 'text' && typeof node.value === 'string' && node.value.trim() === '';
}

function getOnlyImageChildren(paragraph: ElementNode): ElementNode[] | undefined {
  const content = paragraph.children.filter((child) => !isWhitespaceText(child));

  if (content.length === 0 || !content.every(isImageElement)) {
    return undefined;
  }

  return content;
}

function createImageGallery(images: ElementNode[]): ElementNode {
  const imageCount = images.length;

  if (imageCount === 1) {
    return {
      type: 'element',
      tagName: 'figure',
      properties: {
        className: ['pl-image-gallery'],
        dataImageCount: String(imageCount),
      },
      children: images,
    };
  }

  return {
    type: 'element',
    tagName: 'figure',
    properties: {
      className: ['pl-image-gallery'],
      dataImageCount: String(imageCount),
      dataPlImageGallery: '',
    },
    children: [
      createGalleryButton('previous'),
      {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['pl-image-gallery__track'],
          dataPlImageGalleryTrack: '',
        },
        children: images.map(createGalleryItem),
      },
      createGalleryButton('next'),
    ],
  };
}

function createGalleryItem(image: ElementNode): ElementNode {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['pl-image-gallery__item'],
    },
    children: [image],
  };
}

function createGalleryButton(direction: 'previous' | 'next'): ElementNode {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      ariaLabel: direction === 'previous' ? 'Previous image' : 'Next image',
      className: ['pl-image-gallery__button'],
      dataPlImageGalleryButton: direction,
      type: 'button',
    },
    children: [createChevronIcon(direction)],
  };
}

function createChevronIcon(direction: 'previous' | 'next'): ElementNode {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      ariaHidden: 'true',
      className: ['pl-image-gallery__button-icon'],
      fill: 'none',
      height: '20',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      viewBox: '0 0 24 24',
      width: '20',
      xmlns: 'http://www.w3.org/2000/svg',
    },
    children: [
      {
        type: 'element',
        tagName: 'path',
        properties: {
          d: direction === 'previous' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6',
        },
        children: [],
      },
    ],
  };
}
