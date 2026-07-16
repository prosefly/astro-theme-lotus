import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { OverrideComponentName, OverrideComponentsConfig } from './theme';

const overrideComponentNames = [
  'HeaderNavbar',
  'HeaderSocialIcons',
  'PageActions',
  'PageHeader',
  'PageNavigation',
  'SearchDialog',
  'SiteBrand',
  'ThemeSwitch',
] as const satisfies OverrideComponentName[];
const overrideComponentModulePrefix = 'virtual:prosefly/lotus/components/';
const resolvedOverrideComponentModulePrefix = `\0${overrideComponentModulePrefix}`;

const defaultOverrideComponents = {
  HeaderNavbar: new URL('../components/defaults/HeaderNavbar.astro', import.meta.url),
  HeaderSocialIcons: new URL('../components/defaults/HeaderSocialIcons.astro', import.meta.url),
  PageActions: new URL('../components/defaults/PageActions.astro', import.meta.url),
  PageHeader: new URL('../components/defaults/PageHeader.astro', import.meta.url),
  PageNavigation: new URL('../components/defaults/PageNavigation.astro', import.meta.url),
  SearchDialog: new URL('../components/defaults/SearchDialog.astro', import.meta.url),
  SiteBrand: new URL('../components/defaults/SiteBrand.astro', import.meta.url),
  ThemeSwitch: new URL('../components/defaults/ThemeSwitch.astro', import.meta.url),
} satisfies Record<OverrideComponentName, URL>;

function normalizeModulePath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function resolveOverrideComponentPath(
  name: OverrideComponentName,
  components: OverrideComponentsConfig,
  root: URL,
): string {
  const configuredPath = components[name];

  if (configuredPath) {
    return normalizeModulePath(
      path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(fileURLToPath(root), configuredPath),
    );
  }

  return normalizeModulePath(fileURLToPath(defaultOverrideComponents[name]));
}

export function componentOverridePlugin(
  components: OverrideComponentsConfig,
  root: URL,
): Plugin {
  return {
    name: '@prosefly/astro-theme-lotus/components',
    resolveId(id) {
      if (id.startsWith(overrideComponentModulePrefix)) {
        const name = id.slice(overrideComponentModulePrefix.length);

        if (overrideComponentNames.includes(name as OverrideComponentName)) {
          return `${resolvedOverrideComponentModulePrefix}${name}`;
        }
      }
    },
    load(id) {
      if (id.startsWith(resolvedOverrideComponentModulePrefix)) {
        const name = id.slice(
          resolvedOverrideComponentModulePrefix.length,
        ) as OverrideComponentName;
        const componentPath = resolveOverrideComponentPath(name, components, root);

        return `export { default } from ${JSON.stringify(componentPath)};`;
      }
    },
  };
}
