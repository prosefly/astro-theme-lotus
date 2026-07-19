# AGENTS.md

Guidance for coding agents working on Astro Theme Lotus.

## Project Scope

Lotus is an installable Astro documentation theme. It should behave like an
Astro integration, not like a one-off website template.

The package lives in `packages/astro-theme-lotus`. The root `src/` directory is
the documentation/demo site for developing the theme.

`@prosefly/astro-components` is a separate package. Do not inline MDX component
logic into Lotus unless the change is specifically theme-only. Shared MDX
components should be changed in the astro-components package instead.

## Code Organization

- Theme config types live in `packages/astro-theme-lotus/src/lib/theme.ts`.
- Config defaults, option parsing, and related helpers live in
  `packages/astro-theme-lotus/src/lib/config/`.
- Sidebar generation and diagnostics live in
  `packages/astro-theme-lotus/src/lib/sidebar/`.
- Page metadata, edit links, schema, last-updated, and page actions helpers live
  in `packages/astro-theme-lotus/src/lib/page/`.
- Search provider logic lives in `packages/astro-theme-lotus/src/lib/search/`
  and `packages/astro-theme-lotus/src/client/search/`.
- Markdown transforms live in `packages/astro-theme-lotus/src/lib/markdown/`.
- Layout shell components live in
  `packages/astro-theme-lotus/src/components/layout/`.
- Public reusable theme components live in
  `packages/astro-theme-lotus/src/components/theme/`.
- Override defaults live in
  `packages/astro-theme-lotus/src/components/defaults/`.

Keep new code in the nearest existing module group. Avoid adding root-level
`lib/*.ts` files when a focused folder already exists.

## Routing Rules

Routes are injected by the Astro integration. Do not assume docs live under
`/docs`.

Always derive docs URLs from `docsBase` and the existing i18n helpers. The
default `docsBase` is `/`; when users set `docsBase: '/docs'`, `/` is available
for their own homepage.

Pagefind-specific HTML attributes should only be emitted when the active search
provider is Pagefind.

## Design System

Use Lotus CSS tokens instead of hard-coded colors or spacing when possible.
Important tokens include:

- `--lotus-text`
- `--lotus-text-strong`
- `--lotus-text-muted`
- `--lotus-background`
- `--lotus-surface`
- `--lotus-accent`
- `--lotus-accent-soft`
- `--lotus-accent-contrast`
- `--lotus-radius-*`

Astro Components use `--pl-*` tokens. Do not couple those components to
`--lotus-*` tokens directly.

Respect `data-accent`, `data-gray`, `data-radius`, and `data-theme`.
`radius: full` must be handled carefully; do not blindly make dropdowns, code
blocks, dialogs, or media fully rounded.

Frontend UI should stay documentation-focused: compact navigation, readable
prose, predictable sidebars, restrained buttons, and no marketing-style hero
unless a page explicitly uses a splash layout.

## Content And Changelog

The docs content in `src/content/docs/` is part of the demo site and should
reflect actual supported behavior.

Already released changelog sections must not receive new changes. Add new
entries under `Unreleased` until the next version is cut.

Keep English and Simplified Chinese changelog entries in sync when both files
exist.

## Validation

Run these before finishing theme changes:

```bash
pnpm test
pnpm check
pnpm build
```

For visual or responsive layout changes, also run the dev server or preview and
inspect desktop and mobile widths.

## Editing Rules

Use `apply_patch` for manual file edits. Do not revert unrelated user changes.
Keep refactors scoped to the requested behavior and the relevant module group.
