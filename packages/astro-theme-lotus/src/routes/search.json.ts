import type { APIRoute } from 'astro';
import {
  getDocsEntries,
  getDocsNavigation,
  getEntryLocale,
  getEntrySection,
  getEntrySlug,
  getSidebarNavigation,
  getSidebarSectionTitle,
} from '../lib/docs';
import { getLocalizedHref, getLocales } from '../lib/i18n';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import type { LotusThemeConfig } from '../lib/theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

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

export async function getStaticPaths() {
  return getLocales(themeConfig)
    .filter((locale) => locale.pathPrefix)
    .map((locale) => ({
      params: { locale: locale.pathPrefix },
      props: { localeKey: locale.key },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const localeKey = props.localeKey as string | undefined;
  const entries = (await getDocsEntries(localeKey)).filter((entry) => entry.data.pagefind !== false);
  const sections = await getDocsNavigation(undefined, localeKey);
  const sectionLabels = new Map(sections.map((section) => [section.slug, section.label]));
  const items = await Promise.all(
    entries.map(async (entry) => {
      const entryLocaleKey = localeKey ?? getEntryLocale(entry).key;
      const section = getEntrySection(entry, entries, entryLocaleKey);
      const sidebar = await getSidebarNavigation(section, entryLocaleKey);
      const sectionTitle = getSidebarSectionTitle(sidebar, getEntrySlug(entry));
      const content = stripMdx(entry.body ?? '');

      return {
        title: entry.data.title,
        description: entry.data.description,
        href: getLocalizedHref(themeConfig, getEntrySlug(entry), entryLocaleKey),
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
