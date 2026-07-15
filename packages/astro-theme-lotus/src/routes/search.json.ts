import type { APIRoute } from 'astro';
import {
  entryToHref,
  getDocsEntries,
  getDocsNavigation,
  getEntrySection,
  getEntrySlug,
  getSidebarNavigation,
  getSidebarSectionTitle,
} from '../lib/docs';

function stripMdx(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/^\s*import\s.+$/gm, ' ')
    .replace(/^\s*export\s.+$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
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

export const GET: APIRoute = async () => {
  const entries = (await getDocsEntries()).filter((entry) => entry.data.pagefind !== false);
  const sections = await getDocsNavigation();
  const sectionLabels = new Map(sections.map((section) => [section.slug, section.label]));
  const items = await Promise.all(
    entries.map(async (entry) => {
      const section = getEntrySection(entry, entries);
      const sidebar = await getSidebarNavigation(section);
      const sectionTitle = getSidebarSectionTitle(sidebar, entry.id);
      const content = stripMdx(entry.body ?? '');

      return {
        title: entry.data.title,
        description: entry.data.description,
        href: entryToHref(entry),
        slug: getEntrySlug(entry),
        section: section ? sectionLabels.get(section) : undefined,
        group: sectionTitle,
        excerpt: createExcerpt(content),
        content,
      };
    }),
  );

  return new Response(JSON.stringify({ items }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
