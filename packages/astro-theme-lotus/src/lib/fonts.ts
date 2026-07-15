import { fontProviders } from 'astro/config';
import type { LotusThemeConfig } from './theme';

type LotusFontCssVariable = '--font-inter' | '--font-jetbrains-mono';
type LotusFontFallbackVariable = '--lotus-system-sans' | '--lotus-system-mono';
type BuiltinFont = {
  cssVariable: LotusFontCssVariable;
  fallbackVariable: LotusFontFallbackVariable;
  config: {
    provider: ReturnType<typeof fontProviders.fontsource>;
    name: string;
    cssVariable: LotusFontCssVariable;
    weights: [number, ...number[]];
    styles: ['normal'];
    subsets: [string, ...string[]];
    formats: ['woff2'];
  };
};

const builtinFonts = {
  Inter: {
    cssVariable: '--font-inter',
    fallbackVariable: '--lotus-system-sans',
    config: {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
    },
  },
  'JetBrains Mono': {
    cssVariable: '--font-jetbrains-mono',
    fallbackVariable: '--lotus-system-mono',
    config: {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
    },
  },
} satisfies Record<string, BuiltinFont>;

type BuiltinFontName = keyof typeof builtinFonts;

function getBuiltinFont(name: string): BuiltinFont | undefined {
  return builtinFonts[name as BuiltinFontName];
}

function serializeFontFamilyName(name: string): string {
  if (name.startsWith('var(') || name.includes(',')) {
    return name;
  }

  return /\s/.test(name) ? JSON.stringify(name) : name;
}

export function getFontStack(name: string, fallbackVariable: string): string {
  const font = getBuiltinFont(name);

  if (font) {
    return `var(${font.cssVariable}, var(${font.fallbackVariable}))`;
  }

  return `${serializeFontFamilyName(name)}, var(${fallbackVariable})`;
}

export function getFontCssVariables(config: LotusThemeConfig): LotusFontCssVariable[] {
  return Array.from(new Set([config.appearance.fontSans, config.appearance.fontMono]))
    .map((name) => getBuiltinFont(name)?.cssVariable)
    .filter((cssVariable): cssVariable is LotusFontCssVariable => Boolean(cssVariable));
}

export function getAstroFontConfigs(config: LotusThemeConfig) {
  const names = new Set([config.appearance.fontSans, config.appearance.fontMono]);

  return Array.from(names)
    .map((name) => getBuiltinFont(name)?.config)
    .filter((font): font is NonNullable<typeof font> => Boolean(font));
}
