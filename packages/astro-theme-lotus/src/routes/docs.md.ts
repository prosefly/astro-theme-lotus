import type { APIRoute } from 'astro';
import { getDocsEntries, getEntrySlug } from '../lib/docs';
import { getLocales } from '../lib/i18n';
import { createPageMarkdown } from '../lib/page/actions';
import rawThemeConfig from 'virtual:prosefly/lotus/config';
import type { LotusThemeConfig } from '../lib/theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

function getMarkdownRouteParam(locale: ReturnType<typeof getLocales>[number], slug: string): string {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';

  return [
    locale.pathPrefix,
    normalizedSlug === 'index' ? 'index' : normalizedSlug,
  ].filter(Boolean).join('/') || 'index';
}

export async function getStaticPaths() {
  const paths = await Promise.all(getLocales(themeConfig).map(async (locale) => {
    const entries = await getDocsEntries(locale.key);

    return entries.map((entry) => ({
      params: {
        slug: getMarkdownRouteParam(locale, getEntrySlug(entry)),
      },
      props: { entry },
    }));
  }));

  return paths.flat();
}

export const GET: APIRoute = ({ props }) => {
  const entry = props.entry;
  const markdown = createPageMarkdown({
    title: entry.data.title,
    description: entry.data.description,
    body: entry.body,
  });

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
