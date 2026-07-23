import { CacheModuleOptions } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';

const logger = new Logger('RedisCache');

export function createRedisCacheOptions(
  config: ConfigService,
): CacheModuleOptions {
  const host = config.getOrThrow<string>('REDIS_HOST');
  const port = config.getOrThrow<string>('REDIS_PORT');
  const store = new KeyvRedis(`redis://${host}:${port}`);
  store.on('error', (err: Error) =>
    logger.warn(`Redis cache store error: ${err.message}`),
  );

  return {
    stores: [store],
    ttl: Number(config.getOrThrow<string>('REDIS_USER_CACHE_TTL_MS')),
  };
}
