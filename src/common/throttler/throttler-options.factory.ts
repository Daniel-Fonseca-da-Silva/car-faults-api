import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { createHash, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

export const THROTTLER_DEFAULT_NAME = 'default';

/**
 * Reads a positive integer from process.env at request time. Evaluated lazily
 * so the value is read after ConfigModule has loaded and validated .env,
 * instead of at import time (where a missing var silently became NaN).
 */
function readPositiveInt(name: string): number {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export const authThrottlerOptions = {
  ttl: () => readPositiveInt('THROTTLE_AUTH_TTL_MS'),
  limit: () => readPositiveInt('THROTTLE_AUTH_LIMIT'),
};

export const lookupsThrottlerOptions = {
  ttl: () => readPositiveInt('THROTTLE_LOOKUPS_TTL_MS'),
  limit: () => readPositiveInt('THROTTLE_LOOKUPS_LIMIT'),
};

/**
 * Sent by the web app's server. Its requests all leave from a few shared
 * hosting IPs, so per-IP limits would throttle the site itself (and every
 * visitor behind it) instead of a single abusive client.
 */
export const INTERNAL_API_KEY_HEADER = 'x-internal-api-key';

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/**
 * Constant-time check. Hashing first gives both sides the same length, which
 * timingSafeEqual requires, without leaking the expected key's length.
 */
export function isInternalApiKey(
  provided: unknown,
  expected: string | undefined,
): boolean {
  if (!expected || typeof provided !== 'string' || provided.length === 0) {
    return false;
  }
  return timingSafeEqual(sha256(provided), sha256(expected));
}

export function createThrottlerOptions(
  config: ConfigService,
): ThrottlerModuleOptions {
  const internalApiKey = config.get<string>('INTERNAL_API_KEY') || undefined;

  return {
    throttlers: [
      {
        name: THROTTLER_DEFAULT_NAME,
        ttl: Number(config.getOrThrow<string>('THROTTLE_TTL_MS')),
        limit: Number(config.getOrThrow<string>('THROTTLE_LIMIT')),
      },
    ],
    skipIf: (context: ExecutionContext) =>
      isInternalApiKey(
        context
          .switchToHttp()
          .getRequest<Request>()
          .header(INTERNAL_API_KEY_HEADER),
        internalApiKey,
      ),
  };
}
