import type { LotusThemeConfig } from '../theme';

export const DEFAULT_DOCS_BASE_PATH = '/';

export const defaultConfig: LotusThemeConfig = {
  name: 'Documentation',
  description: 'Project documentation.',
  favicon: undefined,
  appearance: {
    accent: 'indigo',
    gray: 'neutral',
    defaultMode: 'system',
    radius: 'medium',
  },
  siteNav: [{ label: 'Docs', href: '/' }],
  socials: [],
  themeModeControl: 'segmented-control',
  docsNav: [],
  search: { provider: 'local' },
  assistant: false,
  llms: true,
  pageActions: [
    { type: 'copy-page', icon: 'lucide:copy' },
    { type: 'view-markdown', icon: 'lucide:file-text' },
    { type: 'open-chatgpt', icon: 'simple-icons:openai' },
    { type: 'open-claude', icon: 'simple-icons:claude' },
    { type: 'open-grok', icon: 'hugeicons:grok' },
    { type: 'open-perplexity', icon: 'simple-icons:perplexity' },
  ],
  contributors: false,
  components: {},
  head: [],
  credits: true,
  docsBase: DEFAULT_DOCS_BASE_PATH,
  source: undefined,
  editLink: undefined,
  defaultLocale: undefined,
  locales: undefined,
  ui: undefined,
  iconify: {
    apiBase: 'https://api.iconify.design',
    preload: [],
    scan: true,
  },
  footer: {
    copyright: '',
    sections: [],
  },
};
