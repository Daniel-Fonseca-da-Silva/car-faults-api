import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export interface RedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export function readRedisConnectionConfig(
  config: ConfigService,
): RedisConnectionConfig {
  const host = config.getOrThrow<string>('REDIS_HOST');
  const port = Number(config.getOrThrow<string>('REDIS_PORT'));
  const username = config.get<string>('REDIS_USER') || undefined;
  const password = config.get<string>('REDIS_PASSWORD') || undefined;

  return { host, port, username, password };
}

export function buildRedisConnectionUrl(
  connection: RedisConnectionConfig,
): string {
  const { host, port, username, password } = connection;

  let auth = '';
  if (password) {
    const user = username ? encodeURIComponent(username) : '';
    auth = `${user}:${encodeURIComponent(password)}@`;
  } else if (username) {
    auth = `${encodeURIComponent(username)}@`;
  }

  return `redis://${auth}${host}:${port}`;
}

export function buildRedisClientOptions(
  connection: RedisConnectionConfig,
): RedisOptions {
  const { host, port, username, password } = connection;

  return {
    host,
    port,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    lazyConnect: true,
  };
}
