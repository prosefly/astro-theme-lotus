import { getDefaultLocale, getLocales, type NormalizedLocale } from './i18n';
import type { LotusThemeConfig } from './theme';
import arabicMessages from '../messages/ar.json';
import germanMessages from '../messages/de.json';
import englishMessages from '../messages/en.json';
import spanishMessages from '../messages/es.json';
import frenchMessages from '../messages/fr.json';
import italianMessages from '../messages/it.json';
import japaneseMessages from '../messages/ja.json';
import koreanMessages from '../messages/ko.json';
import portugueseBrazilMessages from '../messages/pt-br.json';
import russianMessages from '../messages/ru.json';
import zhCnMessages from '../messages/zh-cn.json';
import zhTwMessages from '../messages/zh-tw.json';

const englishTranslations = englishMessages;

const builtInTranslations: Record<string, Partial<UiTranslations>> = {
  ar: arabicMessages,
  de: germanMessages,
  en: englishMessages,
  es: spanishMessages,
  fr: frenchMessages,
  it: italianMessages,
  ja: japaneseMessages,
  ko: koreanMessages,
  'pt-br': portugueseBrazilMessages,
  ru: russianMessages,
  'zh-cn': zhCnMessages,
  'zh-tw': zhTwMessages,
};

export type BuiltInUiTranslationKey = keyof typeof englishTranslations;
export type UiTranslationKey = BuiltInUiTranslationKey | (string & {});
export type UiTranslations = Record<string, string>;

export type TranslationValues = Record<string, string | number | boolean | undefined>;

export interface TranslationExistsOptions {
  lngs?: string[];
}

export interface LotusTranslate {
  (key: UiTranslationKey, values?: TranslationValues): string;
  all(): UiTranslations;
  dir(localeKey?: string): 'ltr' | 'rtl';
  exists(key: UiTranslationKey, options?: TranslationExistsOptions): boolean;
  locale(): NormalizedLocale;
}

const rtlLanguageCodes = new Set([
  'ar',
  'arc',
  'dv',
  'fa',
  'ha',
  'he',
  'khw',
  'ks',
  'ku',
  'ps',
  'ur',
  'yi',
]);

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

function getLocaleDirection(config: LotusThemeConfig, localeKey: string | undefined): 'ltr' | 'rtl' {
  if (!localeKey) {
    return 'ltr';
  }

  const normalized = normalizeLocaleKey(localeKey);
  const locale = getLocales(config).find((candidate) => {
    return (
      candidate.key === localeKey ||
      candidate.lang === localeKey ||
      normalizeLocaleKey(candidate.key) === normalized ||
      normalizeLocaleKey(candidate.lang) === normalized
    );
  });

  if (locale) {
    return locale.dir;
  }

  const [languageCode] = (normalized ?? localeKey).split('-');

  return rtlLanguageCodes.has(languageCode) ? 'rtl' : 'ltr';
}

export function interpolate(template: string, values?: TranslationValues): string {
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
): LotusTranslate {
  const translations = getUiTranslations(config, locale);

  function exists(key: UiTranslationKey, options?: TranslationExistsOptions): boolean {
    if (options?.lngs?.length) {
      return options.lngs.some((localeKey) => {
        const translationSet = getTranslationSet(config, localeKey);

        return typeof translationSet?.[key] === 'string';
      });
    }

    return typeof translations[key] === 'string';
  }

  function t(key: UiTranslationKey, values?: TranslationValues): string {
    return interpolate(translations[key] ?? (englishTranslations as Record<string, string>)[key] ?? key, values);
  };

  t.all = () => ({ ...translations });
  t.dir = (localeKey?: string) => getLocaleDirection(config, localeKey ?? locale.key);
  t.exists = exists;
  t.locale = () => locale;

  return t;
}
