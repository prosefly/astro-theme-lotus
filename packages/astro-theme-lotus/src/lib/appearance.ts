import rawThemeConfig from 'virtual:prosefly/lotus/config';
import { accentScales, type LotusThemeConfig, type ThemeMode } from './theme';

const themeConfig = rawThemeConfig as LotusThemeConfig;

const presetAccents = new Set<string>(accentScales);

const hexColorPattern = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

function serializeStyleVariables(
  variables: Record<string, string | undefined>,
): string {
  return Object.entries(variables)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function srgbToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function parseHexColor(hex: string): [number, number, number] | undefined {
  if (!hexColorPattern.test(hex)) {
    return undefined;
  }

  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const value = Number.parseInt(normalized.slice(1), 16);

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function hexToOklch(hex: string): { chroma: number; hue: number } | undefined {
  const rgb = parseHexColor(hex);

  if (!rgb) {
    return undefined;
  }

  const [red, green, blue] = rgb.map(srgbToLinear);
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const b = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.sqrt(a * a + b * b);
  const hue = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;

  return { chroma, hue };
}

function formatOklch(lightness: number, chroma: number, hue: number): string {
  const formattedLightness = `${Number((lightness * 100).toFixed(1))}%`;
  const formattedChroma = Number(chroma.toFixed(3));
  const formattedHue = Number(hue.toFixed(3));

  return `oklch(${formattedLightness} ${formattedChroma} ${formattedHue})`;
}

function getCustomAccentVariables(accent: string): Record<string, string> {
  const color = hexToOklch(accent);

  if (!color) {
    return {
      '--lotus-accent-light': accent,
      '--lotus-accent-dark': accent,
    };
  }

  const chroma = color.chroma < 0.02 ? 0 : clamp(color.chroma, 0.08, 0.24);
  const darkChroma = color.chroma < 0.02 ? 0 : Math.min(chroma, 0.2);

  return {
    '--lotus-accent-light': formatOklch(0.58, chroma, color.hue),
    '--lotus-accent-dark': formatOklch(0.72, darkChroma, color.hue),
  };
}

export function getThemeAttributes(): Record<string, string> {
  const defaultTheme = themeConfig.appearance.defaultMode as ThemeMode;
  const accent = themeConfig.appearance.accent;
  const isPresetAccent = presetAccents.has(accent);
  const customAccentStyle = isPresetAccent
    ? ''
    : serializeStyleVariables(getCustomAccentVariables(accent));
  const attributes: Record<string, string> = {
    'data-theme': defaultTheme,
    'data-radius': themeConfig.appearance.radius,
    'data-gray': themeConfig.appearance.gray,
  };

  if (isPresetAccent) {
    attributes['data-accent'] = accent;
  }

  if (customAccentStyle) {
    attributes.style = customAccentStyle;
  }

  return attributes;
}
