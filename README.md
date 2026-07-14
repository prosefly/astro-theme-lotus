# Astro Theme Lotus

Astro Theme Lotus is a documentation theme for Astro v7, Tailwind CSS v4, and
MDX. It gives you a docs-first starter with configurable navigation, theme
tokens, and shared MDX components so the sample content can serve as real
project documentation instead of placeholder pages.

## Installation

Create a new project from the template:

```sh
npm create astro@latest -- --template prosefly/astro-theme-lotus
```

Install dependencies after the project is created:

```sh
npm install
```

## Development

Run the local development server:

```sh
npm run dev
```

Validate content and types:

```sh
npm run check
```

Build the static site:

```sh
npm run build
```

## Project structure

```txt
.
├── src/
│   ├── components/
│   │   ├── layout/
│   │   └── mdx/
│   ├── content/
│   │   └── docs/
│   ├── lib/
│   └── theme.config.ts
├── public/
└── package.json
```

- `src/theme.config.ts` defines site metadata, appearance, navigation, actions,
  docs sections, and footer links.
- `src/content/docs/` holds the documentation pages that drive the homepage,
  subnav, and section sidebars.
- `src/components/mdx/` contains the shared MDX components documented in the
  docs site.

## Theme configuration

Lotus keeps first-release customization in `src/theme.config.ts`. Supported
today:

- MDX-powered documentation pages.
- Dark mode foundation with light, dark, or system defaults.
- Configurable navigation, header actions, and footer sections.
- Configurable accent palette, gray palette, fonts, and corner radius.
- Content-driven subnav and sidebar sections from `docs.sections` and page
  frontmatter.

Deferred for a later release:

- Search.
- i18n.
- Versioned docs.

## Content structure

Pages under `src/content/docs/` define the docs experience. The root index page
renders at `/docs/`, and nested pages use `section` plus `order` frontmatter to
control grouping and sorting. The sidebar for each section is generated from the
content tree, so most navigation changes happen by editing content instead of
templates.

## Design system

Lotus combines Tailwind utilities for layout and spacing with semantic `--lotus-*`
tokens for background, text, accent color, fonts, radius, and prose styling.
The theme config sets high-level appearance choices, while the design system
reference documents how those choices map to rendered UI.

## MDX components

The first release includes shared MDX components for common docs patterns:

- `Callout` and `Badge` for status and editorial guidance.
- `Steps` and `Step` for procedures.
- `CardGrid` and `Card` for grouped links.
- `Tabs` and `TabItem` for static side-by-side variants.

Each component page includes an import snippet, a rendered example, a props
table, and any first-release limitations.

## License

This project is released under the BSD-3-Clause license. See the repository
license file for the full text.
