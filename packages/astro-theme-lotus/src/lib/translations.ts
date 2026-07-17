import { getDefaultLocale, type NormalizedLocale } from './i18n';
import type { LotusThemeConfig } from './theme';

const englishTranslations = {
  '404.description': 'The page could not be found on {{site}}.',
  '404.heading': 'Page not found',
  '404.text': 'The page you are looking for does not exist or has moved.',
  '404.openDocs': 'Open documentation',
  '404.backHome': 'Back home',
  'appearance.accent': 'Accent',
  'appearance.customAccent': 'Custom accent',
  'appearance.gray': 'Gray',
  'appearance.preview': 'Preview appearance',
  'appearance.radius': 'Radius',
  'appearance.reset': 'Reset',
  'languageSelect.accessibleLabel': 'Select language',
  'menuButton.label': 'Menu',
  'navbar.primary': 'Primary',
  'mobileDocs.closeMenu': 'Close documentation menu',
  'mobileDocs.documentation': 'Documentation',
  'mobileDocs.menu': 'Documentation menu',
  'mobileDocs.openMenu': 'Open documentation menu',
  'mobileDocs.pageCount.one': '{{count}} page',
  'mobileDocs.pageCount.other': '{{count}} pages',
  'page.editLink': 'Edit this page',
  'pageActions.assistantPrompt': 'Read this documentation page: {{url}}',
  'pageActions.copied': 'Copied',
  'pageActions.copyFailed': 'Copy failed',
  'pageActions.copyPage': 'Copy page',
  'pageActions.copying': 'Copying...',
  'pageActions.openChatGPT': 'Open in ChatGPT',
  'pageActions.openClaude': 'Open in Claude',
  'pageActions.openLink': 'Open link',
  'pageActions.show': 'Show page actions',
  'pageActions.viewMarkdown': 'View as Markdown',
  'pageNavigation.accessibleLabel': 'Page navigation',
  'search.closeLabel': 'Close search',
  'search.label': 'Search documentation',
  'search.loading': 'Loading search index...',
  'search.noResults': 'No results found.',
  'search.placeholder': 'Search docs',
  'search.triggerLabel': 'Search docs',
  'search.typeToSearch': 'Type to search documentation.',
  'search.unavailable': 'Search is unavailable.',
  'sidebar.accessibleLabel': 'Sidebar',
  'tableOfContents.onThisPage': 'On this page',
  'themeSelect.accessibleLabel': 'Theme mode',
  'themeSelect.auto': 'System',
  'themeSelect.cycle': 'Cycle theme mode',
  'themeSelect.dark': 'Dark',
  'themeSelect.darkTheme': 'Dark theme',
  'themeSelect.light': 'Light',
  'themeSelect.lightTheme': 'Light theme',
} as const;

const builtInTranslations: Record<string, Partial<UiTranslations>> = {
  en: englishTranslations,
  'zh-cn': {
    '404.description': '无法在 {{site}} 上找到该页面。',
    '404.heading': '页面未找到',
    '404.text': '你要访问的页面不存在，或已经移动。',
    '404.openDocs': '打开文档',
    '404.backHome': '返回首页',
    'appearance.accent': '主色',
    'appearance.customAccent': '自定义主色',
    'appearance.gray': '灰阶',
    'appearance.preview': '预览外观',
    'appearance.radius': '圆角',
    'appearance.reset': '重置',
    'languageSelect.accessibleLabel': '选择语言',
    'menuButton.label': '菜单',
    'navbar.primary': '主导航',
    'mobileDocs.closeMenu': '关闭文档菜单',
    'mobileDocs.documentation': '文档',
    'mobileDocs.menu': '文档菜单',
    'mobileDocs.openMenu': '打开文档菜单',
    'mobileDocs.pageCount.one': '{{count}} 个页面',
    'mobileDocs.pageCount.other': '{{count}} 个页面',
    'page.editLink': '编辑此页',
    'pageActions.assistantPrompt': '阅读这个文档页面：{{url}}',
    'pageActions.copied': '已复制',
    'pageActions.copyFailed': '复制失败',
    'pageActions.copyPage': '复制页面',
    'pageActions.copying': '正在复制...',
    'pageActions.openChatGPT': '在 ChatGPT 中打开',
    'pageActions.openClaude': '在 Claude 中打开',
    'pageActions.openLink': '打开链接',
    'pageActions.show': '显示页面操作',
    'pageActions.viewMarkdown': '查看 Markdown',
    'pageNavigation.accessibleLabel': '页面导航',
    'search.closeLabel': '关闭搜索',
    'search.label': '搜索文档',
    'search.loading': '正在加载搜索索引...',
    'search.noResults': '没有找到结果。',
    'search.placeholder': '搜索文档',
    'search.triggerLabel': '搜索文档',
    'search.typeToSearch': '输入关键词搜索文档。',
    'search.unavailable': '搜索暂不可用。',
    'sidebar.accessibleLabel': '侧边栏',
    'tableOfContents.onThisPage': '本页目录',
    'themeSelect.accessibleLabel': '主题模式',
    'themeSelect.auto': '系统',
    'themeSelect.cycle': '切换主题模式',
    'themeSelect.dark': '深色',
    'themeSelect.darkTheme': '深色主题',
    'themeSelect.light': '浅色',
    'themeSelect.lightTheme': '浅色主题',
  },
};

export type UiTranslationKey = keyof typeof englishTranslations;
export type UiTranslations = Record<UiTranslationKey, string>;

type TranslationValues = Record<string, string | number | boolean | undefined>;

function normalizeLocaleKey(localeKey: string | undefined): string | undefined {
  return localeKey?.trim().toLowerCase();
}

function getTranslationSet(
  config: LotusThemeConfig,
  localeKey: string | undefined,
): Partial<UiTranslations> | undefined {
  if (!localeKey) {
    return undefined;
  }

  const normalized = normalizeLocaleKey(localeKey);

  return (
    config.ui?.[localeKey] ??
    (normalized ? config.ui?.[normalized] : undefined) ??
    builtInTranslations[localeKey] ??
    (normalized ? builtInTranslations[normalized] : undefined)
  );
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const value = values[key];

    return value === undefined ? '' : String(value);
  });
}

export function getUiTranslations(
  config: LotusThemeConfig,
  locale: NormalizedLocale,
): UiTranslations {
  const defaultLocale = getDefaultLocale(config);
  const translations = { ...englishTranslations };
  const localeChain = [
    defaultLocale.lang,
    defaultLocale.key,
    locale.lang,
    locale.key,
  ];

  for (const localeKey of localeChain) {
    Object.assign(translations, getTranslationSet(config, localeKey));
  }

  return translations;
}

export function useTranslations(
  config: LotusThemeConfig,
  locale: NormalizedLocale,
) {
  const translations = getUiTranslations(config, locale);

  return function t(key: UiTranslationKey, values?: TranslationValues): string {
    return interpolate(translations[key] ?? englishTranslations[key], values);
  };
}

export function getPageCountLabel(
  config: LotusThemeConfig,
  locale: NormalizedLocale,
  count: number,
): string {
  const t = useTranslations(config, locale);
  const key = count === 1 ? 'mobileDocs.pageCount.one' : 'mobileDocs.pageCount.other';

  return t(key, { count });
}
