import { defineLotusConfig } from '@prosefly/astro-theme-lotus';

export default defineLotusConfig({
  name: 'Lotus',
  description: 'A documentation theme for Astro.',
  favicon: '/favicon.svg',
  logo: {
    variant: 'lockup',
    light: '/lotus-light.svg',
    dark: '/lotus-dark.svg',
  },
  navbar: [
    { label: 'Docs', href: '/docs/' },
    {
      label: 'Source',
      href: 'https://github.com/prosefly/astro-theme-lotus',
      variant: 'solid',
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
  contributors: {
    avatar: 'gravatar',
    max: 6,
    exclude: ['github-actions[bot]'],
  },
  components: {
    HeaderSocialIcons: './src/components/HeaderSocialIcons.astro',
  },
  homepage: true,
  source: {
    github: 'prosefly/astro-theme-lotus',
    branch: 'main',
    contentRoot: 'src/content',
  },
  editLink: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      directory: 'docs/en',
    },
    'zh-cn': {
      label: '简体中文',
      lang: 'zh-CN',
      directory: 'docs/zh-cn',
    },
  },
  sidebars: [
    {
      slug: 'guide',
      label: 'Guides',
      icon: 'lucide:rocket',
      items: [
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
            'troubleshooting',
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
        {
          label: 'Migrations',
          items: [{ autogenerate: { directory: 'migrations' } }],
        },
      ],
    },
    {
      label: 'Components',
      icon: 'lucide:blocks',
      items: [{ autogenerate: { directory: 'components' } }],
    },
    {
      label: 'Recipes',
      icon: 'lucide:chef-hat',
      items: [{ autogenerate: { directory: 'recipes' } }],
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
        title: 'Tools',
        links: [
          { label: 'Appearance', href: '/docs/configuration/appearance/' },
        ],
      },
      {
        title: 'Community',
        links: [
          {
            label: 'GitHub',
            href: 'https://github.com/prosefly/astro-theme-lotus',
            external: true,
          },
          {
            label: 'X (Twitter)',
            href: 'https://x.com/prosefly',
            external: true,
          },
          {
            label: 'Sponsor',
            href: 'https://github.com/sponsors/lepture',
            external: true,
          },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy', href: '/docs/privacy/' },
          { label: 'Terms', href: '/docs/terms/' },
        ],
      },
    ],
  },
});
