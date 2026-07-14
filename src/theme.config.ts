import type { LotusThemeConfig } from './lib/theme';

const themeConfig = {
  site: {
    title: 'Astro Theme Lotus',
    description: 'A documentation theme for Astro.',
    logo: '/logo.svg',
  },
  appearance: {
    accent: 'indigo',
    gray: 'zinc',
    fontSans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
    defaultTheme: 'system',
    radius: 'medium',
  },
  nav: [
    { label: 'Docs', href: '/docs/' },
    { label: 'Components', href: '/docs/components/callout/' },
    { label: 'References', href: '/docs/references/design-system/' },
  ],
  actions: [
    {
      label: 'GitHub',
      href: 'https://github.com/prosefly/astro-theme-lotus',
      external: true,
      icon: 'github',
    },
  ],
  docs: {
    sections: [
      { slug: 'guide', label: 'Guide', order: 1 },
      { slug: 'components', label: 'Components', order: 2 },
      { slug: 'references', label: 'References', order: 3 },
    ],
  },
  footer: {
    copyright: 'Copyright © 2026 Prosefly.',
    sections: [
      {
        title: 'Docs',
        links: [
          { label: 'Getting Started', href: '/docs/guide/getting-started/' },
          { label: 'Configuration', href: '/docs/guide/configuration/' },
          { label: 'Deployment', href: '/docs/guide/deployment/' },
        ],
      },
      {
        title: 'Components',
        links: [
          { label: 'Callout', href: '/docs/components/callout/' },
          { label: 'Cards', href: '/docs/components/cards/' },
          { label: 'Tabs', href: '/docs/components/tabs/' },
        ],
      },
      {
        title: 'References',
        links: [
          { label: 'Design System', href: '/docs/references/design-system/' },
          { label: 'Markdown', href: '/docs/references/markdown/' },
        ],
      },
      {
        title: 'Project',
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/prosefly/astro-theme-lotus',
            external: true,
          },
        ],
      },
    ],
  },
} satisfies LotusThemeConfig;

export default themeConfig;
