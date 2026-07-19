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
import { resolveLlmsConfig } from '../lib/config';
import { createPageMarkdown } from '../lib/page/actions';
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

function appendEntryLink(
  lines: string[],
  entry: Awaited<ReturnType<typeof getDocsContext>>['entries'][number],
  href: string,
  linkedSlugs?: Set<string>,
) {
  linkedSlugs?.add(getEntrySlug(entry));
  lines.push(formatLink(entry.data.title, href, entry.data.description));
}

function appendFullEntry(
  lines: string[],
  entry: Awaited<ReturnType<typeof getDocsContext>>['entries'][number],
  href: string,
) {
  lines.push(
    '---',
    '',
    createPageMarkdown({
      title: entry.data.title,
      description: entry.data.description,
      body: entry.body,
    }).trim(),
    '',
    `Source: ${href}`,
    '',
  );
}

export const GET: APIRoute = async ({ site, request }) => {
  const llmsConfig = resolveLlmsConfig(themeConfig);
  const isFull = new URL(request.url).pathname.endsWith('/llms-full.txt');

  if (!llmsConfig.enabled || (isFull && !llmsConfig.full)) {
    return new Response('Not found\n', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

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
      const markdownHref = getLocalizedMarkdownHref(themeConfig, getEntrySlug(entry), defaultLocale.key);
      const href = new URL(markdownHref, baseUrl).toString();
      appendEntryLink(lines, entry, href, linkedSlugs);
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
      const markdownHref = getLocalizedMarkdownHref(themeConfig, getEntrySlug(entry), defaultLocale.key);
      const href = new URL(markdownHref, baseUrl).toString();
      appendEntryLink(lines, entry, href);
    }

    lines.push('');
  }

  if (isFull) {
    lines.push('## Full Documentation', '');

    for (const entry of docsContext.entries) {
      const markdownHref = getLocalizedMarkdownHref(themeConfig, getEntrySlug(entry), defaultLocale.key);
      const href = new URL(markdownHref, baseUrl).toString();
      appendFullEntry(lines, entry, href);
    }
  }

  return new Response(`${lines.join('\n').trim()}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
