import { CacheModuleOptions } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import {
  buildRedisConnectionUrl,
  readRedisConnectionConfig,
} from './redis-connection.util';

const logger = new Logger('RedisCache');

export function createRedisCacheOptions(
  config: ConfigService,
): CacheModuleOptions {
  const connection = readRedisConnectionConfig(config);
  const store = new KeyvRedis(buildRedisConnectionUrl(connection));
  store.on('error', (err: Error) =>
    logger.warn(`Redis cache store error: ${err.message}`),
  );

  return {
    stores: [store],
    ttl: Number(config.getOrThrow<string>('REDIS_USER_CACHE_TTL_MS')),
  };
}
