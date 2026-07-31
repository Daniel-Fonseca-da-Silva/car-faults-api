import { DEFAULT_LOCALE, resolveLocale } from './locale.util';

describe('resolveLocale', () => {
  it('returns the state value when it is a supported locale', () => {
    expect(resolveLocale('en-GB')).toBe('en-GB');
    expect(resolveLocale('es-ES')).toBe('es-ES');
    expect(resolveLocale('pt-PT')).toBe('pt-PT');
  });

  it.each([undefined, null, '', 'fr-FR', 42, {}])(
    'falls back to the default locale for %p',
    (state) => {
      expect(resolveLocale(state)).toBe(DEFAULT_LOCALE);
    },
  );
});
