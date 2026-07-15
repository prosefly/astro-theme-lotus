declare module 'virtual:prosefly/lotus/config' {
  import type { LotusThemeConfig } from './lib/theme';

  const config: LotusThemeConfig;
  export default config;
}

declare module 'virtual:prosefly/lotus/components/SearchDialog' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/ThemeSwitch' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}
