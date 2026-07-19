import { isUnifiedProcessor, unified } from '@astrojs/markdown-remark';
import {
  rehypeImageGallery,
  remarkCalloutDirectives,
  remarkPackageManagerTabs,
} from '@prosefly/astro-components/markdown';
import type { AstroConfig } from 'astro';
import { rehypeHeadingAnchors } from '../markdown/heading-anchors';
import { remarkHeadingIds } from '../markdown/heading-ids';
import { resolveExpressiveCodeOptions } from './expressive-code';
import type { LotusIntegrationOptions } from './options';

export function resolveMarkdownConfig(
  options: LotusIntegrationOptions,
  markdownConfig: AstroConfig['markdown'],
) {
  const expressiveCodeOptions = resolveExpressiveCodeOptions(options.expressiveCode);
  const markdownProcessor = markdownConfig?.processor;
  const unifiedOptions =
    markdownProcessor && isUnifiedProcessor(markdownProcessor)
      ? markdownProcessor.options
      : undefined;
  const remarkPlugins = [
    remarkHeadingIds,
    ...(options.calloutDirectives === false ? [] : [remarkCalloutDirectives]),
    ...(unifiedOptions?.remarkPlugins ?? markdownConfig?.remarkPlugins ?? []),
    ...(options.packageManagerTabs === false ? [] : [remarkPackageManagerTabs]),
  ];
  const rehypePlugins = [
    ...(unifiedOptions?.rehypePlugins ?? markdownConfig?.rehypePlugins ?? []),
    rehypeImageGallery,
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
      gfm: unifiedOptions?.gfm ?? markdownConfig?.gfm,
      smartypants: unifiedOptions?.smartypants ?? markdownConfig?.smartypants,
    }),
  };
}
