import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createThrottlerOptions,
  INTERNAL_API_KEY_HEADER,
  isInternalApiKey,
  THROTTLER_DEFAULT_NAME,
} from './throttler-options.factory';

const INTERNAL_API_KEY = 'k'.repeat(32);

function configWith(values: Record<string, string | undefined>) {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`${key} missing`);
      return value;
    },
  } as unknown as ConfigService;
}

function contextWithHeader(value: string | undefined): ExecutionContext {
  const request = {
    header: (name: string) =>
      name === INTERNAL_API_KEY_HEADER ? value : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function skipIfFor(internalApiKey: string | undefined) {
  const options = createThrottlerOptions(
    configWith({
      THROTTLE_TTL_MS: '60000',
      THROTTLE_LIMIT: '100',
      INTERNAL_API_KEY: internalApiKey,
    }),
  );
  if (Array.isArray(options) || !options.skipIf) {
    throw new Error('expected skipIf in the module options');
  }
  return options.skipIf;
}

describe('createThrottlerOptions', () => {
  it('configures the default throttler from the env', () => {
    const options = createThrottlerOptions(
      configWith({ THROTTLE_TTL_MS: '60000', THROTTLE_LIMIT: '100' }),
    );

    expect(Array.isArray(options) ? options : options.throttlers).toEqual([
      { name: THROTTLER_DEFAULT_NAME, ttl: 60000, limit: 100 },
    ]);
  });

  it('skips throttling for requests carrying the internal API key', () => {
    const skipIf = skipIfFor(INTERNAL_API_KEY);

    expect(skipIf(contextWithHeader(INTERNAL_API_KEY))).toBe(true);
  });

  it.each([undefined, '', 'wrong-key', `${INTERNAL_API_KEY}x`])(
    'throttles requests with header %p',
    (header) => {
      const skipIf = skipIfFor(INTERNAL_API_KEY);

      expect(skipIf(contextWithHeader(header))).toBe(false);
    },
  );

  it.each([undefined, ''])(
    'never skips when INTERNAL_API_KEY is %p',
    (internalApiKey) => {
      const skipIf = skipIfFor(internalApiKey);

      expect(skipIf(contextWithHeader(''))).toBe(false);
      expect(skipIf(contextWithHeader(undefined))).toBe(false);
    },
  );
});

describe('isInternalApiKey', () => {
  it('matches only the exact key', () => {
    expect(isInternalApiKey(INTERNAL_API_KEY, INTERNAL_API_KEY)).toBe(true);
    expect(
      isInternalApiKey(INTERNAL_API_KEY.toUpperCase(), INTERNAL_API_KEY),
    ).toBe(false);
  });

  it('rejects non-string headers', () => {
    expect(isInternalApiKey([INTERNAL_API_KEY], INTERNAL_API_KEY)).toBe(false);
  });
});
