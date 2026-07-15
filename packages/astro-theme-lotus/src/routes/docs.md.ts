import type { APIRoute } from 'astro';
import { getDocsEntries, getEntrySlug } from '../lib/docs';
import { createPageMarkdown } from '../lib/page-actions';

export async function getStaticPaths() {
  const entries = await getDocsEntries();

  return entries.map((entry) => ({
    params: { slug: getEntrySlug(entry) === 'index' ? 'index' : getEntrySlug(entry) },
    props: { entry },
  }));
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
