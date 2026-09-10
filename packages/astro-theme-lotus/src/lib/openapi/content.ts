import { createOpenApiPageMarkdown } from './markdown';
import { loadOpenApiPages } from './runtime';

export async function getOpenApiSearchItems(localeKey?: string) {
  const pages = await loadOpenApiPages(localeKey);

  return pages.map(({ entry, page, reference }) => {
    const markdown = createOpenApiPageMarkdown(entry);
    const content = stripMarkdown(markdown);
    const isIntroduction = 'body' in entry;

    return {
      title: isIntroduction ? entry.data.title : entry.data.summary,
      description: entry.data.description,
      href: page.href,
      slug: page.identity,
      section: reference.introduction.data.source.title,
      group: isIntroduction ? undefined : entry.data.group.label,
      excerpt: createExcerpt(content),
      content,
    };
  });
}

function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_~>#|[\]{}]/g, ' ')
    .replace(/^-{3,}$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createExcerpt(text: string, maxLength = 180): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}
