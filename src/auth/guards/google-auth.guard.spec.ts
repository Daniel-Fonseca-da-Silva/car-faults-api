import {
  BadRequestException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_MS,
} from '../oauth-state';
import { GoogleAuthGuard } from './google-auth.guard';

const VALID_STATE = `en-GB.${'a'.repeat(43)}`;

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let superCanActivate: jest.SpyInstance;
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    } as unknown as ConfigService;
    guard = new GoogleAuthGuard(config);
    superCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
          canActivate: () => Promise<boolean>;
        },
        'canActivate',
      )
      .mockResolvedValue(true);
    response = { cookie: jest.fn(), clearCookie: jest.fn() };
  });

  afterEach(() => {
    superCanActivate.mockRestore();
  });

  function buildContext(request: {
    path?: string;
    query: Record<string, unknown>;
    cookies?: Record<string, string>;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/v1/auth/google', ...request }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate on login start', () => {
    it('binds the state to the browser with an httpOnly lax cookie', async () => {
      await expect(
        guard.canActivate(buildContext({ query: { state: VALID_STATE } })),
      ).resolves.toBe(true);

      expect(response.cookie).toHaveBeenCalledWith(
        OAUTH_STATE_COOKIE_NAME,
        VALID_STATE,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: OAUTH_STATE_MAX_AGE_MS,
        }),
      );
      expect(superCanActivate).toHaveBeenCalled();
    });

    it.each([undefined, 'en-GB', 'en-GB.short', ['en-GB']])(
      'rejects a missing or malformed state %p',
      (state) => {
        expect(() =>
          guard.canActivate(buildContext({ query: { state } })),
        ).toThrow(BadRequestException);
        expect(response.cookie).not.toHaveBeenCalled();
        expect(superCanActivate).not.toHaveBeenCalled();
      },
    );
  });

  describe('canActivate on callback', () => {
    const callbackPath = '/v1/auth/google/callback';

    it('accepts the callback when the state matches the cookie and clears it', async () => {
      await expect(
        guard.canActivate(
          buildContext({
            path: callbackPath,
            query: { state: VALID_STATE, code: 'google-code' },
            cookies: { [OAUTH_STATE_COOKIE_NAME]: VALID_STATE },
          }),
        ),
      ).resolves.toBe(true);

      expect(response.clearCookie).toHaveBeenCalledWith(
        OAUTH_STATE_COOKIE_NAME,
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(superCanActivate).toHaveBeenCalled();
    });

    it('rejects a callback whose state does not match the cookie (login CSRF)', () => {
      expect(() =>
        guard.canActivate(
          buildContext({
            path: callbackPath,
            query: { state: VALID_STATE, code: 'attacker-code' },
            cookies: { [OAUTH_STATE_COOKIE_NAME]: `en-GB.${'b'.repeat(43)}` },
          }),
        ),
      ).toThrow(UnauthorizedException);
      expect(response.clearCookie).toHaveBeenCalled();
      expect(superCanActivate).not.toHaveBeenCalled();
    });

    it('rejects a callback when the browser has no state cookie', () => {
      expect(() =>
        guard.canActivate(
          buildContext({
            path: callbackPath,
            query: { state: VALID_STATE, code: 'attacker-code' },
          }),
        ),
      ).toThrow(UnauthorizedException);
      expect(superCanActivate).not.toHaveBeenCalled();
    });
  });

  describe('getAuthenticateOptions', () => {
    it('forwards the state query param to Google so it round-trips to the callback', () => {
      const context = buildContext({ query: { state: VALID_STATE } });

      expect(guard.getAuthenticateOptions(context)).toEqual({
        state: VALID_STATE,
      });
    });

    it('returns undefined when there is no state query param', () => {
      const context = buildContext({ query: {} });

      expect(guard.getAuthenticateOptions(context)).toBeUndefined();
    });

    it('returns undefined when state is not a string', () => {
      const context = buildContext({ query: { state: [VALID_STATE] } });

      expect(guard.getAuthenticateOptions(context)).toBeUndefined();
    });
  });
});
