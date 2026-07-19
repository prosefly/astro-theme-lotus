import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import {
  mergeEcConfigOptions,
  type AstroExpressiveCodeOptions,
} from 'astro-expressive-code';
import type { LotusMarkdownOptions } from './options';

function createInlineSvgUrl(svgContents: string[]): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svgContents.join(''))}")`;
}

const lucideCopyIcon = createInlineSvgUrl([
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`,
  `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>`,
  `<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
  `</svg>`,
]);

const defaultExpressiveCodeOptions: AstroExpressiveCodeOptions = {
  themes: ['github-light', 'github-dark'],
  plugins: [pluginLineNumbers()],
  defaultProps: {
    showLineNumbers: false,
  },
  useDarkModeMediaQuery: true,
  customizeTheme: (theme) => {
    theme.name = theme.type === 'dark' ? 'dark' : 'light';
  },
  useThemedScrollbars: false,
  styleOverrides: {
    borderRadius: 'var(--lotus-radius-lg)',
    borderWidth: '1px',
    borderColor: 'var(--lotus-code-border)',
    codeBackground: 'var(--lotus-code-background)',
    codeForeground: 'var(--lotus-text)',
    codeFontFamily: 'var(--lotus-font-mono)',
    codeFontSize: '0.875rem',
    codeLineHeight: '1.7142857',
    uiFontFamily: 'var(--lotus-font-sans)',
    uiFontSize: '0.8125rem',
    focusBorder: 'var(--lotus-accent)',
    scrollbarThumbColor: 'color-mix(in oklab, var(--lotus-text-muted) 70%, transparent)',
    scrollbarThumbHoverColor: 'var(--lotus-text-muted)',
    frames: {
      copyIcon: lucideCopyIcon,
    },
  },
};

export function resolveExpressiveCodeOptions(
  options: LotusMarkdownOptions['expressiveCode'],
): AstroExpressiveCodeOptions | false {
  if (options === false) {
    return false;
  }

  return mergeEcConfigOptions(defaultExpressiveCodeOptions, options ?? {});
}
