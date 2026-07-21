import { defineLotusConfig } from '@prosefly/astro-theme-lotus';
import sidebars from './theme.sidebar.json';

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
  sidebars,
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
