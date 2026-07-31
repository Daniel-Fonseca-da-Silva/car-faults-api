import { ConfigService } from '@nestjs/config';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  createAccessTokenCookieOptions,
} from './access-token-cookie.factory';

describe('createAccessTokenCookieOptions', () => {
  function configWith(values: Record<string, string>): ConfigService {
    return {
      get: jest.fn(
        (key: string, defaultValue?: string) => values[key] ?? defaultValue,
      ),
    } as unknown as ConfigService;
  }

  it('exposes the cookie name used to store the access token', () => {
    expect(ACCESS_TOKEN_COOKIE_NAME).toBe('access_token');
  });

  it('defaults to httpOnly, path "/", sameSite "lax" and secure false', () => {
    const options = createAccessTokenCookieOptions(configWith({}));

    expect(options).toEqual({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('reads sameSite and secure from the environment', () => {
    const options = createAccessTokenCookieOptions(
      configWith({ COOKIE_SAME_SITE: 'none', COOKIE_SECURE: 'true' }),
    );

    expect(options.sameSite).toBe('none');
    expect(options.secure).toBe(true);
  });

  it('falls back to "lax" when COOKIE_SAME_SITE is invalid', () => {
    const options = createAccessTokenCookieOptions(
      configWith({ COOKIE_SAME_SITE: 'invalid' }),
    );

    expect(options.sameSite).toBe('lax');
  });
});
