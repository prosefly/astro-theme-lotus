import { isUnifiedProcessor, unified } from '@astrojs/markdown-remark';
import {
  rehypeImageGallery,
  remarkCalloutDirectives,
  remarkPackageManagerTabs,
} from '@prosefly/astro-components/markdown';
import type { AstroConfig } from 'astro';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough/parseOnly';
import { rehypeHeadingAnchors } from '../markdown/heading-anchors';
import { remarkHeadingIds } from '../markdown/heading-ids';
import { resolveExpressiveCodeOptions } from './expressive-code';
import type { LotusIntegrationOptions } from './options';

function isCjkLocale(value: string | undefined): boolean {
  return /^(zh|ja|ko)(-|$)/i.test(value ?? '');
}

function shouldUseCjkFriendly(options: LotusIntegrationOptions): boolean {
  const cjkFriendly = options.markdown?.cjkFriendly ?? 'auto';

  if (cjkFriendly !== 'auto') {
    return cjkFriendly;
  }

  return Object.entries(options.locales ?? {}).some(([localeKey, locale]) =>
    isCjkLocale(localeKey) || isCjkLocale(locale.lang)
  );
}

export function resolveMarkdownConfig(
  options: LotusIntegrationOptions,
  markdownConfig: AstroConfig['markdown'],
) {
  const markdownOptions = options.markdown ?? {};
  const expressiveCodeOptions = resolveExpressiveCodeOptions(markdownOptions.expressiveCode);
  const markdownProcessor = markdownConfig?.processor;
  const unifiedOptions =
    markdownProcessor && isUnifiedProcessor(markdownProcessor)
      ? markdownProcessor.options
      : undefined;
  const gfm = unifiedOptions?.gfm ?? markdownConfig?.gfm;
  const cjkFriendlyPlugins = shouldUseCjkFriendly(options)
    ? [
        remarkCjkFriendly,
        ...(gfm === false ? [] : [remarkCjkFriendlyGfmStrikethrough]),
      ]
    : [];
  const remarkPlugins = [
    remarkHeadingIds,
    ...cjkFriendlyPlugins,
    ...(markdownOptions.calloutDirectives === false ? [] : [remarkCalloutDirectives]),
    ...(unifiedOptions?.remarkPlugins ?? markdownConfig?.remarkPlugins ?? []),
    ...(markdownOptions.packageManagerTabs === false ? [] : [remarkPackageManagerTabs]),
  ];
  const rehypePlugins = [
    ...(unifiedOptions?.rehypePlugins ?? markdownConfig?.rehypePlugins ?? []),
    ...(markdownOptions.imageGallery === false ? [] : [rehypeImageGallery]),
    rehypeHeadingAnchors,
  ];

  return {
    ...(expressiveCodeOptions === false
      ? {
          shikiConfig: {
            themes: {
              light: 'github-light',
              dark: 'github-dark',
            },
          },
        }
      : {}),
    processor: unified({
      remarkPlugins,
      rehypePlugins,
      remarkRehype: unifiedOptions?.remarkRehype ?? markdownConfig?.remarkRehype,
      gfm,
      smartypants: unifiedOptions?.smartypants ?? markdownConfig?.smartypants,
    }),
  };
}
