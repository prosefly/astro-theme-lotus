import type { LotusThemeConfig } from '@prosefly/astro-theme-lotus';

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
      label: 'Dashboard',
      href: '/docs/',
    },
  ],
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/prosefly/astro-theme-lotus',
      external: true,
      icon: 'github',
    },
    {
      label: 'X',
      href: 'https://x.com/prosefly',
      external: true,
      icon: 'x',
    },
  ],
  docs: {
    basePath: '/docs',
    sections: [
      {
        slug: 'guide',
        label: 'Guide',
        order: 1,
        sidebar: {
          links: [
            {
              label: 'GitHub',
              href: 'https://github.com/prosefly/astro-theme-lotus',
              external: true,
              icon: 'github',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/prosefly',
              external: true,
              icon: 'discord',
            },
            {
              label: 'Blog',
              href: '/docs/references/markdown/',
              icon: 'lucide:newspaper',
            },
          ],
          groups: [
            {
              title: 'Getting Started',
              items: [
                { label: 'Overview', href: '/docs/guide/getting-started/' },
                { label: 'Configuration', href: '/docs/guide/configuration/' },
                { label: 'Navigation', href: '/docs/guide/navigation/' },
                { label: 'Deployment', href: '/docs/guide/deployment/' },
              ],
            },
            {
              title: 'Components',
              items: [
                {
                  label: 'Content blocks',
                  items: [
                    { label: 'Callout', href: '/docs/components/callout/' },
                    { label: 'Steps', href: '/docs/components/steps/' },
                    { label: 'Cards', href: '/docs/components/cards/' },
                  ],
                },
                {
                  label: 'Inline elements',
                  items: [
                    { label: 'Badge', href: '/docs/components/badge/' },
                    { label: 'Tabs', href: '/docs/components/tabs/' },
                    { label: 'Icon', href: '/docs/components/icon/' },
                  ],
                },
              ],
            },
            {
              title: 'References',
              items: [
                { label: 'Design System', href: '/docs/references/design-system/' },
                { label: 'Markdown', href: '/docs/references/markdown/' },
              ],
            },
          ],
        },
      },
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
