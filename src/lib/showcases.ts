export interface ShowcaseSite {
  name: string;
  eyebrow: string;
  href: string;
  image: string;
  source?: string;
  description: string;
  tags: string[];
}

export const sites: ShowcaseSite[] = [
  {
    name: 'Prosefly',
    eyebrow: 'Project hub',
    href: 'https://prosefly.dev',
    image: '/images/showcase/prosefly.jpg',
    description:
      'The Prosefly project site uses Lotus surfaces for polished docs, project navigation, and open-source tooling pages.',
    tags: ['Project site', 'Docs hub', 'Open source'],
  },
  {
    name: 'Astro Theme Lotus',
    eyebrow: 'Self demo',
    href: 'https://astro-theme-lotus.prosefly.dev',
    image: '/images/showcase/astro-theme-lotus.jpg',
    source: 'https://github.com/prosefly/astro-theme-lotus',
    description:
      'The Lotus documentation site shows the theme in production, including MDX components, i18n, search, and theme controls.',
    tags: ['Documentation', 'i18n', 'PageSpeed 100'],
  },
  {
    name: 'Lotus Starter',
    eyebrow: 'Starter template',
    href: 'https://astro-template-lotus-starter.prosefly.dev/',
    image: '/images/showcase/lotus-starter.jpg',
    source: 'https://github.com/prosefly/astro-template-lotus-starter',
    description:
      'A minimal starting point for new Astro documentation sites with Lotus, content collections, and example pages already wired up.',
    tags: ['Starter', 'Astro', 'MDX'],
  },
];
