import type { APIRoute } from 'astro';
import { createOpenApiPageMarkdown } from '../lib/openapi/markdown';
import { loadOpenApiPage } from '../lib/openapi/runtime';

export const GET: APIRoute = async ({ request }) => {
  const loaded = await loadOpenApiPage(new URL(request.url).pathname);

  if (!loaded) {
    return new Response('Not found\n', { status: 404 });
  }

  return new Response(createOpenApiPageMarkdown(loaded.entry), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
