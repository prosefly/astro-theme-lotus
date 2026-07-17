declare module 'virtual:prosefly/lotus/config' {
  import type { LotusThemeConfig } from './lib/theme';

  const config: LotusThemeConfig;
  export default config;
}

declare namespace App {
  interface Locals {
    t: import('./lib/translations').LotusTranslate;
  }
}

declare module 'virtual:prosefly/lotus/components/Assistant' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/SearchDialog' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/HeaderNavbar' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/HeaderSocialIcons' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/PageActions' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/PageAside' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/PageHeader' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/PageMeta' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/PageNavigation' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/SiteBrand' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}

declare module 'virtual:prosefly/lotus/components/ThemeSwitch' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const component: AstroComponentFactory;
  export default component;
}
