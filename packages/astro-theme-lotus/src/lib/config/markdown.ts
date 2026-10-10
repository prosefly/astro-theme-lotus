import { isUnifiedProcessor, unified } from '@astrojs/markdown-remark';
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
  const existingProcessor = markdownConfig.processor;
  const syntaxHighlightConfig = expressiveCodeOptions === false
    ? {
        shikiConfig: {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        },
      }
    : {};

  if (
    existingProcessor
    && !isUnifiedProcessor(existingProcessor)
    && existingProcessor.name !== 'satteri'
  ) {
    return {
      ...markdownConfig,
      ...syntaxHighlightConfig,
    };
  }

  const unifiedOptions = existingProcessor && isUnifiedProcessor(existingProcessor)
    ? existingProcessor.options
    : undefined;
  const gfm = unifiedOptions?.gfm ?? markdownConfig.gfm;
  const cjkFriendlyPlugins = shouldUseCjkFriendly(options)
    ? [remarkCjkFriendly, ...(gfm === false ? [] : [remarkCjkFriendlyGfmStrikethrough])]
    : [];
  const processor = unified({
    remarkPlugins: [
      remarkHeadingIds,
      ...cjkFriendlyPlugins,
      ...(unifiedOptions?.remarkPlugins ?? markdownConfig.remarkPlugins ?? []),
    ],
    rehypePlugins: [
      ...(unifiedOptions?.rehypePlugins ?? markdownConfig.rehypePlugins ?? []),
      rehypeHeadingAnchors,
    ],
    remarkRehype: unifiedOptions?.remarkRehype ?? markdownConfig.remarkRehype,
    gfm,
    smartypants: unifiedOptions?.smartypants ?? markdownConfig.smartypants,
  });

  return {
    ...markdownConfig,
    ...syntaxHighlightConfig,
    processor,
  };
}
