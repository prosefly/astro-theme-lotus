# Contributing

This repository is a pnpm workspace for the Lotus Astro theme and docs site.

## Workspace

- `packages/astro-theme-lotus/` contains the installable Astro integration,
  layouts, routes, styles, theme components, and content schema.
- `@prosefly/astro-components` is consumed as a published npm package.
- `src/content/` contains the example documentation site used to document and
  test the packages.
- `src/theme.config.ts` configures the example site.

## Development

Install dependencies:

```sh
pnpm install
```

Run the local docs site:

```sh
pnpm run dev
```

Validate before submitting changes:

```sh
pnpm run check
pnpm run build
```

## Documentation Changes

Keep documentation aligned with the public API in `packages/astro-theme-lotus`
and the published `@prosefly/astro-components` package.

- Update package READMEs when exports, integration options, or install steps
  change.
- Update the example docs in `src/content/docs/` when theme behavior changes.
- Prefer one canonical page for each concept, then link to it from related
  pages instead of duplicating full reference tables.
- When documenting routes, keep examples aligned with the default loader. The
  example site uses `docsBase: '/docs'`, `docsLoader()`, and a normal Astro
  homepage at `src/pages/index.astro`.

## Package Boundaries

Use `@prosefly/astro-components` for portable MDX components and Markdown/icon
helpers. Use `@prosefly/astro-theme-lotus` for the docs shell, theme config,
routes, layout, and Lotus-specific theme components.

Avoid importing from package internals in example documentation unless the page
is explicitly documenting implementation details.

## Release Checks

Before preparing a release, verify:

- `pnpm run check` passes.
- `pnpm run build` passes.
- Package READMEs match current exports in each `package.json`.
- The docs site does not describe schema-only compatibility fields as active UI
  features.
- Generated routes include pages, Markdown source routes, and the search index
  expected for the configured `docsBase`.

## Releases

Package releases use npm Trusted Publishing from GitHub Actions. Configure the
Lotus package's trusted publisher to this repository and workflow before
pushing release tags:

- `@prosefly/astro-theme-lotus`: `.github/workflows/release.yml`

Use tags named `astro-theme-lotus-v0.1.0`, matching the package version
exactly. `@prosefly/astro-components` releases from the sibling
`prosefly/astro-components` repository.
