const SUPPORTED_LOCALES = ['pt-PT', 'en-GB', 'es-ES'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'pt-PT';

export function resolveLocale(state: unknown): SupportedLocale {
  return typeof state === 'string' &&
    SUPPORTED_LOCALES.includes(state as SupportedLocale)
    ? (state as SupportedLocale)
    : DEFAULT_LOCALE;
}
