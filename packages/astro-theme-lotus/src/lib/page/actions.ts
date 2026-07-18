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
