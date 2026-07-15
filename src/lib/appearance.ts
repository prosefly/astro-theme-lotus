import themeConfig from '../theme.config';
import type { ThemeMode } from './theme';

function serializeStyleVariables(
  variables: Record<string, string | undefined>,
): string {
  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}

export function getThemeAttributes(): Record<string, string> {
  const defaultTheme = themeConfig.appearance.defaultTheme as ThemeMode;

  return {
    'data-theme': defaultTheme,
    'data-radius': themeConfig.appearance.radius,
    style: serializeStyleVariables({
      '--lotus-font-sans': themeConfig.appearance.fontSans,
      '--lotus-font-mono': themeConfig.appearance.fontMono,
    }),
  };
}
