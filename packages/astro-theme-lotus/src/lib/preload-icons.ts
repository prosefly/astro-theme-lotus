import { resolveIconName } from './icons';
import type { LotusThemeConfig, SidebarItemConfig } from './theme';

const layoutIconNames = [
  'lucide:chevron-down',
  'lucide:chevron-left',
  'lucide:chevron-right',
  'lucide:copy',
  'lucide:ellipsis-vertical',
  'lucide:file-text',
  'lucide:check',
  'lucide:languages',
  'lucide:menu',
  'lucide:monitor',
  'lucide:moon',
  'lucide:pencil',
  'lucide:sparkles',
  'lucide:sun',
  'lucide:x',
  'simple-icons:bun',
  'simple-icons:claude',
  'simple-icons:npm',
  'simple-icons:openai',
  'simple-icons:pdm',
  'simple-icons:poetry',
  'simple-icons:pnpm',
  'simple-icons:pypi',
  'simple-icons:uv',
  'simple-icons:yarn',
] as const;

export function getIconPreloadNames(config: LotusThemeConfig): string[] {
  const iconNames = new Set<string>();

  function addIcon(icon?: string): void {
    if (icon) {
      iconNames.add(resolveIconName(icon));
    }
  }

  function addSidebarItems(items: SidebarItemConfig[] = []): void {
    for (const item of items) {
      if (typeof item === 'string' || 'autogenerate' in item) {
        continue;
      }

      addIcon(item.icon);

      if ('items' in item) {
        addSidebarItems(item.items);
      }
    }
  }

  for (const icon of layoutIconNames) {
    addIcon(icon);
  }

  for (const item of config.navbar) {
    addIcon(item.icon);
    addIcon(item.trailingIcon);
  }

  for (const item of config.socials) {
    addIcon(item.icon);
  }

  for (const item of config.pageActions) {
    addIcon(item.icon);
  }

  for (const icon of config.iconify?.preload ?? []) {
    addIcon(icon);
  }

  for (const sidebar of config.sidebars) {
    addIcon(sidebar.icon);
    addSidebarItems(sidebar.items);
  }

  return [...iconNames].sort();
}
