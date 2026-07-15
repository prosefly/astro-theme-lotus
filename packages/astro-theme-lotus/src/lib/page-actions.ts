export interface PageMarkdownInput {
  title: string;
  description?: string;
  body?: string;
}

export function createPageMarkdown({ title, description, body }: PageMarkdownInput): string {
  const parts = [`# ${title}`];
  const normalizedDescription = description?.trim();
  const normalizedBody = body?.trim();

  if (normalizedDescription) {
    parts.push('', normalizedDescription);
  }

  if (normalizedBody) {
    parts.push('', normalizedBody);
  }

  return `${parts.join('\n')}\n`;
}

export function getPageMarkdownHref(slug: string | undefined, docsBasePath: string): string {
  const normalizedSlug = slug && slug !== 'index' ? slug.replace(/^\/+|\/+$/g, '') : 'index';
  const normalizedBase = docsBasePath === '/' ? '' : docsBasePath.replace(/\/$/, '');

  return `${normalizedBase}/${normalizedSlug}.md`;
}
