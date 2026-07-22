import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const THROTTLER_DEFAULT_NAME = 'default';

export const authThrottlerOptions = {
  ttl: Number(process.env.THROTTLE_AUTH_TTL_MS),
  limit: Number(process.env.THROTTLE_AUTH_LIMIT),
};

export function createThrottlerOptions(
  config: ConfigService,
): ThrottlerModuleOptions {
  return [
    {
      name: THROTTLER_DEFAULT_NAME,
      ttl: Number(config.get('THROTTLE_TTL_MS')),
      limit: Number(config.get('THROTTLE_LIMIT')),
    },
  ];
}
