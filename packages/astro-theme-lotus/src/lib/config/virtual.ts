import type { Plugin } from 'vite';
import type { LotusThemeConfig } from '../theme';

const virtualConfigModuleId = 'virtual:prosefly/lotus/config';
const resolvedVirtualConfigModuleId = `\0${virtualConfigModuleId}`;

export function lotusConfigPlugin(config: LotusThemeConfig): Plugin {
  return {
    name: '@prosefly/astro-theme-lotus/config',
    resolveId(id) {
      if (id === virtualConfigModuleId) {
        return resolvedVirtualConfigModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualConfigModuleId) {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}
