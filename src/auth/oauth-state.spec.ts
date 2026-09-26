import { ConfigService } from '@nestjs/config';
import {
  createOAuthStateCookieOptions,
  oauthStatesMatch,
  parseOAuthState,
} from './oauth-state';

const NONCE = 'A1_-'.repeat(11);

describe('parseOAuthState', () => {
  it('splits a valid state into locale and nonce', () => {
    expect(parseOAuthState(`es-ES.${NONCE}`)).toEqual({
      locale: 'es-ES',
      nonce: NONCE,
    });
  });

  it.each([
    undefined,
    null,
    42,
    '',
    'pt-PT',
    `pt-PT.${'a'.repeat(42)}`,
    `pt-PT.${NONCE}!`,
    `.${NONCE}`,
  ])('returns null for %p', (state) => {
    expect(parseOAuthState(state)).toBeNull();
  });
});

describe('oauthStatesMatch', () => {
  it('matches identical states', () => {
    expect(oauthStatesMatch(`pt-PT.${NONCE}`, `pt-PT.${NONCE}`)).toBe(true);
  });

  it.each([
    [`pt-PT.${NONCE}`, `pt-PT.${NONCE}x`],
    [`pt-PT.${NONCE}`, `en-GB.${NONCE}`],
    [undefined, `pt-PT.${NONCE}`],
    [`pt-PT.${NONCE}`, undefined],
    [`pt-PT.${NONCE}`, [`pt-PT.${NONCE}`]],
  ])('does not match %p with %p', (expected, actual) => {
    expect(oauthStatesMatch(expected, actual)).toBe(false);
  });
});

describe('createOAuthStateCookieOptions', () => {
  function configWith(secure?: string): ConfigService {
    return {
      get: jest.fn((_key: string, fallback?: string) => secure ?? fallback),
    } as unknown as ConfigService;
  }

  it('builds an httpOnly lax cookie that is secure when COOKIE_SECURE=true', () => {
    expect(createOAuthStateCookieOptions(configWith('true'))).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });

  it('is secure by default', () => {
    expect(createOAuthStateCookieOptions(configWith()).secure).toBe(true);
  });

  it('only disables secure when COOKIE_SECURE is explicitly "false"', () => {
    expect(createOAuthStateCookieOptions(configWith('false')).secure).toBe(
      false,
    );
  });
});
