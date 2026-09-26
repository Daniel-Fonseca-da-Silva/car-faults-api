import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

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

export function createThrottlerOptions(
  config: ConfigService,
): ThrottlerModuleOptions {
  return [
    {
      name: THROTTLER_DEFAULT_NAME,
      ttl: Number(config.getOrThrow<string>('THROTTLE_TTL_MS')),
      limit: Number(config.getOrThrow<string>('THROTTLE_LIMIT')),
    },
  ];
}
