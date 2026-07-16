import rawThemeConfig from 'virtual:prosefly/lotus/config';
import { getCustomAccentVariables, isPresetAccent } from './colors';
import type { LotusThemeConfig, ThemeMode } from './theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

function serializeStyleVariables(
  variables: Record<string, string | undefined>,
): string {
  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}

export function getThemeAttributes(): Record<string, string> {
  const defaultTheme = themeConfig.appearance.defaultMode as ThemeMode;
  const accent = themeConfig.appearance.accent;
  const isPreset = isPresetAccent(accent);
  const customAccentStyle = isPreset
    ? ''
    : serializeStyleVariables(getCustomAccentVariables(accent));
  const attributes: Record<string, string> = {
    'data-theme': defaultTheme,
    'data-radius': themeConfig.appearance.radius,
    'data-gray': themeConfig.appearance.gray,
  };

  if (isPreset) {
    attributes['data-accent'] = accent;
  }

  if (customAccentStyle) {
    attributes.style = customAccentStyle;
  }

  return attributes;
}
