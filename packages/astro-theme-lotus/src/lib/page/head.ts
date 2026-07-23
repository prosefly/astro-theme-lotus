export interface HeadConfigEntry {
  tag: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  content?: string;
  src?: string;
}

export type HeadConfig = HeadConfigEntry[];

function getAttr(
  keys: string[],
  entry: HeadConfigEntry,
): [key: string, value: string | number | boolean] | undefined {
  for (const key of keys) {
    const value = entry.attrs?.[key];

    if (value) {
      return [key, value];
    }
  }

  return undefined;
}

function hasOneOf(head: HeadConfig, entry: HeadConfigEntry, keys: string[]): boolean {
  const attr = getAttr(keys, entry);

  if (!attr) {
    return false;
  }

  const [key, value] = attr;

  return head.some(({ tag, attrs }) => tag === entry.tag && attrs?.[key] === value);
}

function hasTag(head: HeadConfig, entry: HeadConfigEntry): boolean {
  switch (entry.tag) {
    case 'title':
      return head.some(({ tag }) => tag === 'title');
    case 'meta':
      return hasOneOf(head, entry, ['name', 'property', 'http-equiv']);
    case 'link':
      return head.some(
        ({ attrs }) =>
          (entry.attrs?.rel === 'canonical' && attrs?.rel === 'canonical') ||
          (entry.attrs?.rel === 'sitemap' && attrs?.rel === 'sitemap'),
      );
    default:
      return false;
  }
}

function mergeHead(oldHead: HeadConfig, newHead: HeadConfig): HeadConfig {
  return [...oldHead.filter((tag) => !hasTag(newHead, tag)), ...newHead];
}

function getImportance(entry: HeadConfigEntry): number {
  if (
    entry.tag === 'meta' &&
    entry.attrs &&
    ('charset' in entry.attrs || 'http-equiv' in entry.attrs || entry.attrs.name === 'viewport')
  ) {
    return 100;
  }

  if (entry.tag === 'title') {
    return 90;
  }

  if (entry.tag !== 'meta') {
    if (entry.tag === 'link' && entry.attrs?.rel === 'shortcut icon') {
      return 70;
    }

    return 80;
  }

  return 0;
}

function sortHead(head: HeadConfig): HeadConfig {
  return [...head].sort((a, b) => {
    const aImportance = getImportance(a);
    const bImportance = getImportance(b);

    return aImportance > bImportance ? -1 : bImportance > aImportance ? 1 : 0;
  });
}

export function createHead(defaults: HeadConfig, ...heads: Array<HeadConfig | undefined>): HeadConfig {
  let head = defaults;

  for (const next of heads) {
    if (next) {
      head = mergeHead(head, next);
    }
  }

  return sortHead(head);
}

export function isHeadStyleSource(entry: HeadConfigEntry): entry is HeadConfigEntry & { src: string } {
  return entry.tag === 'style' && Boolean(entry.src);
}
