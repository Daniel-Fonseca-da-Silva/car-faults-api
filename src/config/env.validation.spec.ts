import { JWT_SECRET_MIN_LENGTH, validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    JWT_SECRET: 'x'.repeat(JWT_SECRET_MIN_LENGTH),
    THROTTLE_TTL_MS: '60000',
    THROTTLE_LIMIT: '100',
    THROTTLE_AUTH_TTL_MS: '60000',
    THROTTLE_AUTH_LIMIT: '10',
    THROTTLE_LOOKUPS_TTL_MS: '60000',
    THROTTLE_LOOKUPS_LIMIT: '30',
    THROTTLE_AI_MOBILE_TTL_MS: '3600000',
    THROTTLE_AI_MOBILE_LIMIT: '20',
  };

  it('returns the env when it is valid', () => {
    expect(validateEnv(validEnv)).toBe(validEnv);
  });

  it('rejects a JWT_SECRET shorter than the minimum length', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      'JWT_SECRET',
    );
  });

  it.each(['', undefined, 'abc', '0', '-1', '1.5'])(
    'rejects THROTTLE_LIMIT=%p',
    (value) => {
      expect(() => validateEnv({ ...validEnv, THROTTLE_LIMIT: value })).toThrow(
        'THROTTLE_LIMIT must be a positive integer',
      );
    },
  );

  it('rejects COOKIE_SECURE=false with COOKIE_SAME_SITE=none', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        COOKIE_SAME_SITE: 'none',
        COOKIE_SECURE: 'false',
      }),
    ).toThrow('COOKIE_SECURE');
  });

  it('allows COOKIE_SECURE=false and TURNSTILE_ENABLED=false outside production', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        NODE_ENV: 'development',
        COOKIE_SECURE: 'false',
        TURNSTILE_ENABLED: 'false',
      }),
    ).not.toThrow();
  });

  it('rejects COOKIE_SECURE=false in production', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        NODE_ENV: 'production',
        COOKIE_SECURE: 'false',
      }),
    ).toThrow('COOKIE_SECURE must not be "false" in production');
  });

  it('rejects TURNSTILE_ENABLED=false in production', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        NODE_ENV: 'production',
        TURNSTILE_ENABLED: 'false',
      }),
    ).toThrow('TURNSTILE_ENABLED must not be "false" in production');
  });
});
