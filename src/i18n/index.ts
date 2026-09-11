import en from './en.json';

/**
 * All user-facing copy lives in src/i18n/<locale>.json, never in markup.
 * Adding Russian later means dropping in ru.json and registering it here.
 */
export const locales = { en } as const;

export type Locale = keyof typeof locales;
export const defaultLocale: Locale = 'en';

export function t(locale: Locale = defaultLocale) {
  return locales[locale];
}
