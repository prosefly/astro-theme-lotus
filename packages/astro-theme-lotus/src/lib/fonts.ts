import { fontProviders } from 'astro/config';
import type { LotusThemeConfig } from './theme';

type FontStyle = 'normal' | 'italic' | 'oblique';
type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot' | 'svg';
type FontWeight = number | string;
type LotusFontCssVariable = '--font-inter' | '--font-jetbrains-mono';

interface LotusFontDefinition {
  name: string;
  cssVariable: LotusFontCssVariable;
  fallbackVariable: '--lotus-system-sans' | '--lotus-system-mono';
  fallbacks: [string, ...string[]];
  weights: [FontWeight, ...FontWeight[]];
  styles: [FontStyle, ...FontStyle[]];
  subsets: [string, ...string[]];
  formats: [FontFormat, ...FontFormat[]];
}

const defaultFontDefinitions = [
  {
    name: 'Inter',
    cssVariable: '--font-inter',
    fallbackVariable: '--lotus-system-sans',
    fallbacks: ['system-ui'],
    weights: [400, 500, 600, 700, 800],
    styles: ['normal', 'italic'],
    subsets: ['latin', 'cyrillic'],
    formats: ['woff2'],
  },
  {
    name: 'JetBrains Mono',
    cssVariable: '--font-jetbrains-mono',
    fallbackVariable: '--lotus-system-mono',
    fallbacks: ['monospace'],
    weights: [400, 500, 600],
    styles: ['normal'],
    subsets: ['latin'],
    formats: ['woff2'],
  },
] satisfies LotusFontDefinition[];

function getDefaultFontDefinition(name: string): LotusFontDefinition | undefined {
  return defaultFontDefinitions.find((font) => font.name === name);
}

function serializeFontFamilyName(name: string): string {
  if (name.startsWith('var(') || name.includes(',')) {
    return name;
  }

  return /\s/.test(name) ? JSON.stringify(name) : name;
}

export function getFontStack(name: string, fallbackVariable: string): string {
  const font = getDefaultFontDefinition(name);

  if (font) {
    return `var(${font.cssVariable}, var(${font.fallbackVariable}))`;
  }

  return `${serializeFontFamilyName(name)}, var(${fallbackVariable})`;
}

export function getFontCssVariables(config: LotusThemeConfig): LotusFontCssVariable[] {
  return [config.appearance.fontSans, config.appearance.fontMono]
    .map((name) => getDefaultFontDefinition(name)?.cssVariable)
    .filter((cssVariable): cssVariable is LotusFontCssVariable => Boolean(cssVariable));
}

export function getAstroFontConfigs(config: LotusThemeConfig) {
  const names = new Set([config.appearance.fontSans, config.appearance.fontMono]);

  return defaultFontDefinitions
    .filter((font) => names.has(font.name))
    .map((font) => ({
      provider: fontProviders.fontsource(),
      name: font.name,
      cssVariable: font.cssVariable,
      weights: font.weights,
      styles: font.styles,
      subsets: font.subsets,
      formats: font.formats,
      fallbacks: font.fallbacks,
    }));
}
