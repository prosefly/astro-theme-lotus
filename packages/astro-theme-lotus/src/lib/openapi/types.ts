import type { AstroIntegration } from 'astro';
import type {
  OpenApiConfig,
  SidebarBadge,
  SidebarOpenApiOptions,
} from '../theme';

type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export interface ResolvedOpenApiConfig {
  file: string;
  base: string;
  operationBase: string;
  groupBy: unknown;
  schemaBudget?: unknown;
  source?: string;
}

export interface OpenApiSourceData {
  title: string;
  description?: string;
  version: string;
  file: string;
  servers: Array<{ url: string; description?: string }>;
  securitySchemes: Array<Record<string, unknown>>;
}

export interface OpenApiIntroductionData {
  type: 'introduction';
  title: string;
  description: string;
  source: OpenApiSourceData;
}

export interface OpenApiExchangeData {
  type: 'operation' | 'webhook';
  title: string;
  summary: string;
  description?: string;
  lead?: string;
  content?: string;
  method: HttpMethod;
  path?: string;
  name?: string;
  group: { label: string; slug: string };
  tags: string[];
  deprecated: boolean;
  security: unknown[];
  parameters: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses: Array<Record<string, unknown>>;
  source: OpenApiSourceData;
}

export interface OpenApiIntroductionEntry {
  id: 'introduction';
  data: OpenApiIntroductionData;
  body: string;
}

export interface OpenApiExchangeEntry {
  id: string;
  data: OpenApiExchangeData;
}

export interface OpenApiNavLink {
  label: string;
  link: string;
  slug?: string;
  icon?: string;
  badge?: SidebarBadge;
}

export interface OpenApiNavGroup {
  label: string;
  icon?: string;
  collapsed?: boolean;
  items: OpenApiNavItem[];
}

export type OpenApiNavItem = OpenApiNavLink | OpenApiNavGroup;

export interface OpenApiReference {
  config: ResolvedOpenApiConfig;
  introduction: OpenApiIntroductionEntry;
  operations: OpenApiExchangeEntry[];
  webhooks: OpenApiExchangeEntry[];
  navigation: OpenApiNavItem[];
}

export interface OpenApiModule {
  default(options: OpenApiConfig): AstroIntegration;
  resolveOpenApiSources(options: OpenApiConfig): ResolvedOpenApiConfig[];
  loadOpenApiReference(
    options: SidebarOpenApiOptions | ({ config: ResolvedOpenApiConfig } & SidebarOpenApiOptions),
    root?: URL,
  ): Promise<OpenApiReference>;
}

export interface OpenApiPageRecord {
  sourceKey: string;
  source?: string;
  entryId: string;
  kind: 'introduction' | 'operation' | 'webhook';
  localeKey: string;
  identity: string;
  href: string;
  route: string;
  markdownHref: string;
}

export interface OpenApiManifest {
  root: string;
  pages: OpenApiPageRecord[];
  sources: Array<{
    key: string;
    source?: string;
  }>;
}

export interface LoadedOpenApiPage {
  page: OpenApiPageRecord;
  reference: OpenApiReference;
  entry: OpenApiIntroductionEntry | OpenApiExchangeEntry;
}
