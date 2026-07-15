const iconAliases: Record<string, string> = {
  bluesky: 'simple-icons:bluesky',
  discord: 'simple-icons:discord',
  external: 'lucide:external-link',
  github: 'simple-icons:github',
  x: 'simple-icons:x',
};

export function resolveIconName(icon?: string): string {
  if (!icon) {
    return 'lucide:external-link';
  }

  if (icon.includes(':')) {
    return icon;
  }

  return iconAliases[icon] ?? icon;
}
