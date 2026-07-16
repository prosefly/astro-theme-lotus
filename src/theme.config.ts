import type { LotusThemeConfig } from '@prosefly/astro-theme-lotus';

const themeConfig = {
  name: 'Astro Theme Lotus',
  description: 'A documentation theme for Astro.',
  logo: '/logo.svg',
  appearance: {
    accent: 'indigo',
    gray: 'neutral',
    defaultMode: 'system',
    radius: 'medium',
  },
  navbar: [
    { label: 'Docs', href: '/docs/' },
    { label: 'Components', href: '/docs/components/callout/' },
    { label: 'References', href: '/docs/references/design-system/' },
    {
      label: 'Dashboard',
      href: '/docs/',
      variant: 'soft',
    },
    {
      label: 'Get started',
      href: '/docs/overview/',
      variant: 'solid',
      color: 'accent',
      trailingIcon: 'lucide:chevron-right',
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
  pageActions: [
    { type: 'copy-page' },
    { type: 'view-markdown' },
    { type: 'open-chatgpt' },
    { type: 'open-claude' },
  ],
  docsBase: '/docs',
  sidebars: [
    {
      slug: 'guide',
      label: 'Guides',
      icon: 'lucide:rocket',
      items: [
        {
          label: 'GitHub',
          link: 'https://github.com/prosefly/astro-theme-lotus',
          external: true,
          icon: 'simple-icons:github',
        },
        {
          label: 'Discord',
          link: 'https://discord.gg/prosefly',
          external: true,
          icon: 'simple-icons:discord',
        },
        {
          label: 'Blog',
          link: '/docs/essentials/markdown-syntax/',
          icon: 'lucide:newspaper',
        },
        {
          label: 'Getting Started',
          items: [
            'overview',
            'installation',
            {
              label: 'Configuration',
              items: [{ autogenerate: { directory: 'configuration' } }],
            },
            'deployment',
          ],
        },
        {
          label: 'Essentials',
          items: [{ autogenerate: { directory: 'essentials' } }],
        },
        {
          label: 'Customization',
          items: [{ autogenerate: { directory: 'customization' } }],
        },
      ],
    },
    {
      label: 'Components',
      icon: 'lucide:blocks',
      items: [{ autogenerate: { directory: 'components' } }],
    },
    {
      label: 'References',
      icon: 'lucide:book-open',
      items: [{ autogenerate: { directory: 'references' } }],
    },
  ],
  footer: {
    copyright: 'Copyright © 2026 Prosefly.',
    sections: [
      {
        title: 'Docs',
        links: [
          { label: 'Overview', href: '/docs/overview/' },
          { label: 'Installation', href: '/docs/installation/' },
          { label: 'Configuration', href: '/docs/configuration/project/' },
          { label: 'Deployment', href: '/docs/deployment/' },
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
          { label: 'Markdown Syntax', href: '/docs/essentials/markdown-syntax/' },
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
