import { describe, expect, it, vi } from 'vitest';
import { resolveLotusConfig } from '../src/lib/config/resolve';
import {
  createOpenApiPageMarkdown,
  getOpenApiHeadings,
} from '../src/lib/openapi/markdown';
import { findOpenApiModule, loadOpenApiModule } from '../src/lib/openapi/module';
import {
  getOpenApiInjectedRoutes,
  prepareOpenApi,
} from '../src/lib/openapi/setup';
import type {
  OpenApiModule,
  OpenApiReference,
  ResolvedOpenApiConfig,
} from '../src/lib/openapi/types';
import type { OpenApiConfig } from '../src/lib/theme';

describe('optional OpenAPI integration', () => {
  it('does not load the restricted package when OpenAPI is not configured', async () => {
    const module = createOpenApiModule();
    const config = resolveLotusConfig({});
    const prepared = await prepareOpenApi(config, new URL('file:///project/'), { module });

    expect(module.resolveOpenApiSources).not.toHaveBeenCalled();
    expect(prepared.integration).toBeUndefined();
    expect(prepared.manifest.pages).toEqual([]);
  });

  it('requires top-level configuration for OpenAPI sidebar items', async () => {
    const config = resolveLotusConfig({
      docsNav: [{ label: 'API', items: [{ openapi: {} }] }],
    });

    await expect(prepareOpenApi(config, new URL('file:///project/'), {
      module: createOpenApiModule(),
    })).rejects.toThrow('OpenAPI sidebar items require a top-level `openapi` configuration.');
  });

  it('removes OpenAPI navigation when the restricted package is not installed', async () => {
    const config = resolveLotusConfig({
      openapi: {
        file: './src/openapi.yaml',
        base: '/api',
      },
      docsNav: [
        { label: 'Guides', items: ['overview'] },
        { label: 'API Reference', items: [{ openapi: {} }] },
      ],
    });
    const prepared = await prepareOpenApi(config, new URL('file:///project/'), {
      module: null,
    });

    expect(prepared.config.openapi).toBeUndefined();
    expect(prepared.config.docsNav).toMatchObject([
      { label: 'Guides', items: ['overview'] },
    ]);
    expect(prepared.integration).toBeUndefined();
    expect(prepared.manifest.pages).toEqual([]);
  });

  it('expands a single source into namespaced navigation and exact localized routes', async () => {
    const module = createOpenApiModule();
    const watched: string[] = [];
    const config = resolveLotusConfig({
      docsBase: '/docs',
      locales: {
        root: { label: 'English', directory: 'en' },
        'zh-cn': { label: '简体中文', directory: 'zh-cn' },
      },
      openapi: {
        file: './src/openapi.yaml',
        base: '/docs/api',
      },
      docsNav: [{
        slug: 'api',
        label: 'API Reference',
        items: [{ openapi: {} }],
      }],
    });
    const prepared = await prepareOpenApi(config, new URL('file:///project/'), {
      module,
      addWatchFile: (file) => watched.push(file),
    });

    expect(watched).toEqual(['./src/openapi.yaml']);
    expect(prepared.integration?.name).toBe('fake-openapi');
    expect(prepared.config.docsNav[0]?.items).toMatchObject([
      {
        label: 'Introduction',
        link: '/docs/api/',
        slug: 'openapi:single:introduction',
      },
      {
        label: 'Products',
        items: [{
          label: 'List products',
          link: '/docs/api/endpoints/list-products/',
          slug: 'openapi:single:endpoints/list-products',
        }],
      },
    ]);
    expect(prepared.manifest.pages).toHaveLength(4);
    const routes = getOpenApiInjectedRoutes(prepared.manifest);

    expect(routes.map((route) => route.pattern)).toEqual([
      '/docs/api',
      '/docs/api/index.md',
      '/docs/api/endpoints/list-products',
      '/docs/api/endpoints/list-products.md',
      '/docs/zh-cn/api',
      '/docs/zh-cn/api/index.md',
      '/docs/zh-cn/api/endpoints/list-products',
      '/docs/zh-cn/api/endpoints/list-products.md',
    ]);
    expect(routes.find((route) => route.pattern === '/docs/api')?.entrypoint.pathname)
      .toMatch(/\/openapi-index\.astro$/);
    expect(routes.find((route) => route.pattern === '/docs/api/endpoints/list-products')?.entrypoint.pathname)
      .toMatch(/\/openapi-docs\.astro$/);
  });

  it('selects named sources and forwards sidebar display options', async () => {
    const module = createOpenApiModule();
    const config = resolveLotusConfig({
      openapi: {
        sources: {
          cafe: { file: './cafe.yaml', base: '/api/cafe' },
          fruits: { file: './fruits.yaml', base: '/api/fruits' },
        },
      },
      docsNav: [{
        label: 'Cafe API',
        items: [{
          openapi: {
            source: 'cafe',
            introduction: false,
            methodBadge: false,
          },
        }],
      }],
    });
    const prepared = await prepareOpenApi(config, new URL('file:///project/'), { module });

    expect(prepared.config.docsNav[0]?.items).toMatchObject([
      {
        label: 'Products',
        items: [{ label: 'List products' }],
      },
    ]);
    expect(module.loadOpenApiReference).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ source: 'cafe' }),
        introduction: false,
        methodBadge: false,
      }),
      new URL('file:///project/'),
    );
  });

  it('reports missing and outdated restricted packages clearly', async () => {
    const missing = Object.assign(new Error('Cannot find package @prosefly-pro/astro-openapi'), {
      code: 'ERR_MODULE_NOT_FOUND',
    });

    await expect(findOpenApiModule(async () => {
      throw missing;
    })).resolves.toBeUndefined();
    await expect(loadOpenApiModule(async () => {
      throw missing;
    })).rejects.toThrow('requires the restricted optional package');
    await expect(loadOpenApiModule(async () => ({ default() {} }))).rejects.toThrow(
      'does not expose `loadOpenApiReference()` and `resolveOpenApiSources()`',
    );
  });

  it('creates useful Markdown for introductions and operations', () => {
    const reference = createReference({
      file: './api.yaml',
      base: '/api',
      operationBase: 'endpoints',
      groupBy: 'auto',
    });

    expect(createOpenApiPageMarkdown(reference.introduction)).toContain('# Example API');
    const operationMarkdown = createOpenApiPageMarkdown(reference.operations[0]!);

    expect(operationMarkdown).toContain('`GET /products`');
    expect(operationMarkdown).toContain('## Responses');
    expect(operationMarkdown.match(/Returns products\./g)).toHaveLength(1);
  });

  it('collects introduction headings for the page aside', async () => {
    await expect(getOpenApiHeadings([
      '## Overview',
      '',
      '### Authentication',
      '',
      '#### Details',
    ].join('\n'))).resolves.toEqual([
      { depth: 2, slug: 'overview', text: 'Overview' },
      { depth: 3, slug: 'authentication', text: 'Authentication' },
    ]);
  });
});

function createOpenApiModule(): OpenApiModule {
  return {
    default: vi.fn(() => ({ name: 'fake-openapi', hooks: {} })),
    resolveOpenApiSources: vi.fn((options: OpenApiConfig) => {
      if ('sources' in options) {
        return Object.entries(options.sources).map(([source, value]) => resolveSource(value, source));
      }

      return [resolveSource(options)];
    }),
    loadOpenApiReference: vi.fn(async (options) => {
      const config = 'config' in options
        ? options.config
        : resolveSource({ file: './api.yaml' }, options.source);

      return createReference(config, options.introduction !== false);
    }),
  };
}

function resolveSource(
  source: { file: string; base?: string; operationBase?: string },
  name?: string,
): ResolvedOpenApiConfig {
  return {
    ...source,
    source: name,
    base: source.base ?? '/api',
    operationBase: source.operationBase ?? 'endpoints',
    groupBy: 'auto',
  };
}

function createReference(
  config: ResolvedOpenApiConfig,
  introduction = true,
): OpenApiReference {
  const source = {
    title: 'Example API',
    version: '1.0.0',
    file: config.file,
    servers: [],
    securitySchemes: [],
  };
  const operation = {
    id: 'endpoints/list-products',
    data: {
      type: 'operation' as const,
      title: 'List products',
      summary: 'List products',
      description: 'Returns products.',
      lead: 'Returns products.',
      content: 'Returns products.',
      method: 'get' as const,
      path: '/products',
      group: { label: 'Products', slug: 'products' },
      tags: ['products'],
      deprecated: false,
      security: [],
      parameters: [],
      responses: [{ status: '200', description: 'OK' }],
      source,
    },
  };

  return {
    config,
    introduction: {
      id: 'introduction',
      body: '## Overview\n\nExample documentation.',
      data: {
        type: 'introduction',
        title: 'Example API',
        description: 'Example documentation.',
        source,
      },
    },
    operations: [operation],
    webhooks: [],
    navigation: [
      ...(introduction
        ? [{ label: 'Introduction', link: `${config.base}/`, slug: 'introduction' }]
        : []),
      {
        label: 'Products',
        items: [{
          label: 'List products',
          link: `${config.base}/endpoints/list-products/`,
          slug: 'endpoints/list-products',
        }],
      },
    ],
  };
}
