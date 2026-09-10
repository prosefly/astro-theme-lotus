import type { Plugin } from 'vite';
import type { OpenApiManifest } from './types';

const virtualModuleId = 'virtual:prosefly/lotus/openapi';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

export const emptyOpenApiManifest: OpenApiManifest = {
  root: '',
  pages: [],
  sources: [],
};

export function openApiManifestPlugin(manifest: OpenApiManifest): Plugin {
  return {
    name: '@prosefly/astro-theme-lotus/openapi',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(manifest)};`;
      }
    },
  };
}
