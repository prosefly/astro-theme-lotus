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
  docsBase: '/docs',
  navbar: [
    { label: 'Docs', href: '/docs/' },
    { label: 'Pricing', href: '/pricing/' },
    { label: 'Sponsors', href: '/sponsors/' },
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
    max: 6,
    exclude: ['github-actions[bot]'],
  },
  components: {
    HeaderSocialIcons: './src/components/lotus/HeaderSocialIcons.astro',
    ThemeSwitch: './src/components/lotus/ThemeSwitch.astro',
  },
  source: {
    github: 'prosefly/astro-theme-lotus',
    branch: 'main',
  },
  editLink: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      directory: 'en',
    },
    'zh-cn': {
      label: '简体中文',
      lang: 'zh-CN',
      directory: 'zh-cn',
    },
  },
  sidebars: [
    {
      slug: 'guide',
      label: 'Guides',
      translations: {
        'zh-cn': '指南',
      },
      icon: 'lucide:rocket',
      items: [
        {
          label: 'Discussion',
          translations: {
            'zh-cn': '讨论',
          },
          link: 'https://github.com/prosefly/astro-theme-lotus/discussions',
          external: true,
          icon: 'lucide:messages-square',
        },
        {
          label: 'Getting Started',
          translations: {
            'zh-cn': '入门',
          },
          items: [
            'overview',
            'installation',
            {
              label: 'Configuration',
              translations: {
                'zh-cn': '配置',
              },
              items: [{ autogenerate: { directory: 'configuration' } }],
            },
            'deployment',
            'changelog',
            'troubleshooting',
          ],
        },
        {
          label: 'Essentials',
          translations: {
            'zh-cn': '基础',
          },
          items: [{ autogenerate: { directory: 'essentials' } }],
        },
        {
          label: 'Customization',
          translations: {
            'zh-cn': '自定义',
          },
          items: [{ autogenerate: { directory: 'customization' } }],
        },
        {
          label: 'Migrations',
          translations: {
            'zh-cn': '迁移',
          },
          items: [{ autogenerate: { directory: 'migrations' } }],
        },
      ],
    },
    {
      label: 'Components',
      translations: {
        'zh-cn': '组件',
      },
      icon: 'lucide:blocks',
      items: [{ autogenerate: { directory: 'components' } }],
    },
    {
      label: 'Recipes',
      translations: {
        'zh-cn': '实践',
      },
      icon: 'lucide:chef-hat',
      items: [{ autogenerate: { directory: 'recipes' } }],
    },
    {
      label: 'References',
      translations: {
        'zh-cn': '参考',
      },
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
        title: 'Projects',
        links: [
          {
            label: 'Astro Components',
            href: 'https://astro-components.prosefly.dev',
            external: true,
          },
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
          { label: 'Sponsors', href: '/sponsors/' },
          {
            label: 'Sponsor Prosefly',
            href: 'https://github.com/sponsors/prosefly',
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
