import iconConfig from 'virtual:prosefly/astro-components/icon/config';
import type { MiddlewareHandler } from 'astro';

let collectionsPromise: Promise<Record<string, unknown>> | undefined;

async function loadIconCollections(): Promise<Record<string, unknown>> {
  const entries = Object.entries(iconConfig.iconsByPrefix).filter(([, icons]) => icons.length > 0);

  if (entries.length === 0) {
    return {};
  }

  const collections = await Promise.all(
    entries.map(async ([prefix, icons]) => {
      const iconQuery = icons.map((icon) => encodeURIComponent(icon)).join(',');
      const response = await fetch(
        `${iconConfig.apiBase}/${encodeURIComponent(prefix)}.json?icons=${iconQuery}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to preload Iconify data for "${prefix}" from ${iconConfig.apiBase}.`,
        );
      }

      return [prefix, await response.json()];
    }),
  );

  return Object.fromEntries(collections);
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  collectionsPromise ??= loadIconCollections();
  const collections = await collectionsPromise;
  const locals = context.locals as typeof context.locals & {
    proseflyIconCollections?: Record<string, unknown>;
  };

  locals.proseflyIconCollections = {
    ...(locals.proseflyIconCollections ?? {}),
    ...collections,
  };

  return next();
};
