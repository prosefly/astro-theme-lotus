import type { LotusThemeConfig } from './theme';

export type JsonLdNode = Record<string, unknown>;

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface DocsSchemaInput {
  themeConfig: LotusThemeConfig;
  baseUrl: URL | string;
  pageUrl: string;
  title: string;
  description?: string;
  sectionTitle?: string;
  breadcrumbs: BreadcrumbItem[];
  markdownUrl?: string;
  lastUpdated?: Date | boolean;
}

function toAbsoluteUrl(href: string, baseUrl: URL | string): string {
  return new URL(href, baseUrl).toString();
}

function getSiteUrl(baseUrl: URL | string): string {
  const url = new URL(baseUrl);

  return `${url.origin}/`;
}

function compactObject<T extends JsonLdNode>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

export function stringifyJsonLd(schema: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function createDocsJsonLd({
  themeConfig,
  baseUrl,
  pageUrl,
  title,
  description,
  sectionTitle,
  breadcrumbs,
  markdownUrl,
  lastUpdated,
}: DocsSchemaInput): JsonLdNode {
  const siteUrl = getSiteUrl(baseUrl);
  const websiteId = `${siteUrl}#website`;
  const webpageId = `${pageUrl}#webpage`;
  const articleId = `${pageUrl}#article`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const absoluteBreadcrumbs = breadcrumbs.map((item) => ({
    label: item.label,
    href: toAbsoluteUrl(item.href, baseUrl),
  }));
  const dateModified = lastUpdated instanceof Date
    ? lastUpdated.toISOString()
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      compactObject({
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: themeConfig.site.title,
        description: themeConfig.site.description,
      }),
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: absoluteBreadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          item: item.href,
        })),
      },
      compactObject({
        '@type': 'WebPage',
        '@id': webpageId,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { '@id': websiteId },
        breadcrumb: { '@id': breadcrumbId },
      }),
      compactObject({
        '@type': 'TechArticle',
        '@id': articleId,
        headline: title,
        description,
        url: pageUrl,
        mainEntityOfPage: { '@id': webpageId },
        isPartOf: { '@id': websiteId },
        articleSection: sectionTitle,
        dateModified,
        encoding: markdownUrl
          ? {
              '@type': 'MediaObject',
              encodingFormat: 'text/markdown',
              contentUrl: markdownUrl,
            }
          : undefined,
      }),
    ],
  };
}
