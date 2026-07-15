import rawThemeConfig from 'virtual:prosefly/lotus/config';
import type { LotusThemeConfig, ThemeMode } from './theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

const accentFallbacks: Record<string, { light: string; dark: string }> = {
  blue: { light: 'oklch(0.546 0.245 262.881)', dark: 'oklch(0.707 0.165 254.624)' },
  emerald: { light: 'oklch(0.596 0.145 163.225)', dark: 'oklch(0.765 0.177 163.223)' },
  indigo: { light: 'oklch(0.511 0.262 276.966)', dark: 'oklch(0.673 0.182 276.935)' },
  orange: { light: 'oklch(0.646 0.222 41.116)', dark: 'oklch(0.75 0.183 55.934)' },
  purple: { light: 'oklch(0.558 0.288 302.321)', dark: 'oklch(0.714 0.203 305.504)' },
  rose: { light: 'oklch(0.586 0.253 17.585)', dark: 'oklch(0.712 0.194 13.428)' },
  teal: { light: 'oklch(0.6 0.118 184.704)', dark: 'oklch(0.777 0.152 181.912)' },
  violet: { light: 'oklch(0.541 0.281 293.009)', dark: 'oklch(0.702 0.183 293.541)' },
};

function serializeStyleVariables(
  variables: Record<string, string | undefined>,
): string {
  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}

function getAccentVariables(accent: string): Record<string, string> {
  const palette = accentFallbacks[accent];

  if (palette) {
    return {
      '--lotus-accent-light': `var(--color-${accent}-600, ${palette.light})`,
      '--lotus-accent-dark': `var(--color-${accent}-400, ${palette.dark})`,
    };
  }

  return {
    '--lotus-accent-light': accent,
    '--lotus-accent-dark': accent,
  };
}

export function getThemeAttributes(): Record<string, string> {
  const defaultTheme = themeConfig.appearance.defaultTheme as ThemeMode;

  return {
    'data-theme': defaultTheme,
    'data-radius': themeConfig.appearance.radius,
    'data-gray': themeConfig.appearance.gray,
    style: serializeStyleVariables({
      '--lotus-font-sans': themeConfig.appearance.fontSans,
      '--lotus-font-mono': themeConfig.appearance.fontMono,
      ...getAccentVariables(themeConfig.appearance.accent),
    }),
  };
}
