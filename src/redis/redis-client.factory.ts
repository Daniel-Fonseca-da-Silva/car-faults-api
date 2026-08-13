import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  buildRedisClientOptions,
  readRedisConnectionConfig,
} from './redis-connection.util';

const logger = new Logger('RedisClient');

export function createRedisClient(config: ConfigService): Redis {
  const connection = readRedisConnectionConfig(config);
  const client = new Redis(buildRedisClientOptions(connection));
  client.on('error', (err: Error) =>
    logger.warn(`Redis client error: ${err.message}`),
  );

  return client;
}
