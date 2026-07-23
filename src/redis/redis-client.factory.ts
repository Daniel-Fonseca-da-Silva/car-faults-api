import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const logger = new Logger('RedisClient');

export function createRedisClient(config: ConfigService): Redis {
  const client = new Redis({
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: Number(config.getOrThrow<string>('REDIS_PORT')),
    lazyConnect: true,
  });
  client.on('error', (err: Error) =>
    logger.warn(`Redis client error: ${err.message}`),
  );

  return client;
}
