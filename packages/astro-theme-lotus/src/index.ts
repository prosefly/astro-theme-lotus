import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';

export interface LotusIntegrationOptions {
  site?: LotusSiteOptions;
  appearance?: LotusAppearanceOptions;
  nav?: LotusLink[];
  actions?: LotusLink[];
  footer?: LotusFooterSection[];
}

export interface LotusSiteOptions {
  title?: string;
  description?: string;
  logo?: string;
}

export interface LotusAppearanceOptions {
  accent?: string;
  gray?: string;
  radius?: string;
}

export interface LotusLink {
  label: string;
  href: string;
}

export interface LotusFooterSection {
  title: string;
  links: LotusLink[];
}

export default function lotus(_options: LotusIntegrationOptions = {}): AstroIntegration {
  return {
    name: '@prosefly/astro-theme-lotus',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          integrations: [mdx()],
          vite: {
            plugins: [tailwindcss()],
          },
        });
      },
    },
  };
}

export { lotus };
