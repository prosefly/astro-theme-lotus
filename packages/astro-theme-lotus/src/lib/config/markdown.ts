import { isUnifiedProcessor } from '@astrojs/markdown-remark';
import {
  resolveMarkdownConfig as resolveSharedMarkdownConfig,
  type MarkdownOptions,
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
  const extensions = resolveMarkdownExtensions(options, markdownConfig);

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
    ...resolveSharedMarkdownConfig({
      calloutDirectives: markdownOptions.calloutDirectives,
      packageManagerTabs: markdownOptions.packageManagerTabs,
      imageGallery: markdownOptions.imageGallery,
      ...extensions,
    }, markdownConfig),
  };
}

export function resolveMarkdownExtensions(
  options: LotusIntegrationOptions,
  markdownConfig: AstroConfig['markdown'],
): Pick<MarkdownOptions, 'remarkPluginsBeforeTransforms' | 'remarkPluginsAfterTransforms' | 'rehypePluginsBeforeTransforms' | 'rehypePluginsAfterTransforms'> {
  const markdownProcessor = markdownConfig?.processor;
  const unifiedOptions = markdownProcessor && isUnifiedProcessor(markdownProcessor)
    ? markdownProcessor.options
    : undefined;
  const gfm = unifiedOptions?.gfm ?? markdownConfig?.gfm;
  const cjkFriendlyPlugins = shouldUseCjkFriendly(options)
    ? [remarkCjkFriendly, ...(gfm === false ? [] : [remarkCjkFriendlyGfmStrikethrough])]
    : [];

  return {
    remarkPluginsBeforeTransforms: [remarkHeadingIds, ...cjkFriendlyPlugins],
    remarkPluginsAfterTransforms: [],
    rehypePluginsBeforeTransforms: [],
    rehypePluginsAfterTransforms: [rehypeHeadingAnchors],
  };
}
