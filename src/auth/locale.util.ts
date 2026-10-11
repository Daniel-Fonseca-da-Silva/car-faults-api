const SUPPORTED_LOCALES = [
  'pt-PT',
  'pt-BR',
  'en-GB',
  'en-US',
  'es-ES',
  'es-MX',
  'fr-FR',
  'de-DE',
  'it-IT',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'pt-PT';

export function resolveLocale(state: unknown): SupportedLocale {
  return typeof state === 'string' &&
    SUPPORTED_LOCALES.includes(state as SupportedLocale)
    ? (state as SupportedLocale)
    : DEFAULT_LOCALE;
}
