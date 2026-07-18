import type { APIRoute } from 'astro';
import {
  getDocsContext,
  getEntrySectionFromContext,
  getEntrySlug,
} from '../lib/docs';
import {
  getDefaultLocale,
  getLocalizedMarkdownHref,
} from '../lib/i18n';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import type { LotusThemeConfig } from '../lib/theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1').replace(/\s+/g, ' ').trim();
}

function formatLink(title: string, href: string, description?: string): string {
  const link = `- [${escapeMarkdownText(title)}](${href})`;
  const summary = description?.trim();

  return summary ? `${link}: ${summary}` : link;
}

export const GET: APIRoute = async ({ site, request }) => {
  const defaultLocale = getDefaultLocale(themeConfig);
  const docsContext = await getDocsContext(undefined, defaultLocale.key);
  const entriesBySlug = new Map(
    docsContext.entries.map((entry) => [getEntrySlug(entry), entry]),
  );
  const linkedSlugs = new Set<string>();
  const baseUrl = site ?? new URL(request.url);
  const lines: string[] = [
    `# ${themeConfig.name}`,
    '',
    `> ${themeConfig.description}`,
    '',
  ];

  for (const section of docsContext.sections) {
    const sectionEntries = section.items
      .map((item) => entriesBySlug.get(item.slug))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (sectionEntries.length === 0) {
      continue;
    }

    lines.push(`## ${section.label}`, '');

    for (const entry of sectionEntries) {
      const slug = getEntrySlug(entry);
      linkedSlugs.add(slug);
      const markdownHref = getLocalizedMarkdownHref(themeConfig, slug, defaultLocale.key);
      const href = new URL(markdownHref, baseUrl).toString();
      lines.push(formatLink(entry.data.title, href, entry.data.description));
    }

    lines.push('');
  }

  const unlistedEntries = docsContext.entries.filter((entry) => {
    const slug = getEntrySlug(entry);

    return !linkedSlugs.has(slug) && getEntrySectionFromContext(docsContext, entry) === undefined;
  });

  if (unlistedEntries.length > 0) {
    lines.push('## Other', '');

    for (const entry of unlistedEntries) {
      const slug = getEntrySlug(entry);
      const markdownHref = getLocalizedMarkdownHref(themeConfig, slug, defaultLocale.key);
      const href = new URL(markdownHref, baseUrl).toString();
      lines.push(formatLink(entry.data.title, href, entry.data.description));
    }

    lines.push('');
  }

  return new Response(`${lines.join('\n').trim()}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
