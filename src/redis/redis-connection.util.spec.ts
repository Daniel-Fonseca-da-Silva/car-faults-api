import { ConfigService } from '@nestjs/config';
import {
  buildRedisClientOptions,
  buildRedisConnectionUrl,
  readRedisConnectionConfig,
} from './redis-connection.util';

describe('readRedisConnectionConfig', () => {
  it('reads host and port without auth when REDIS_USER/REDIS_PASSWORD are absent', () => {
    const values: Record<string, string> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const connection = readRedisConnectionConfig(config);

    expect(connection).toEqual({
      host: 'localhost',
      port: 6379,
      username: undefined,
      password: undefined,
    });
  });

  it('reads username and password when present', () => {
    const values: Record<string, string> = {
      REDIS_HOST: 'redis.railway.internal',
      REDIS_PORT: '6379',
      REDIS_USER: 'default',
      REDIS_PASSWORD: 'secret',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const connection = readRedisConnectionConfig(config);

    expect(connection).toEqual({
      host: 'redis.railway.internal',
      port: 6379,
      username: 'default',
      password: 'secret',
    });
  });
});

describe('buildRedisConnectionUrl', () => {
  it('builds a URL without auth when no credentials are present', () => {
    const url = buildRedisConnectionUrl({ host: 'localhost', port: 6379 });

    expect(url).toBe('redis://localhost:6379');
  });

  it('builds a URL with only a password', () => {
    const url = buildRedisConnectionUrl({
      host: 'localhost',
      port: 6379,
      password: 'p@ss/word',
    });

    expect(url).toBe(
      `redis://:${encodeURIComponent('p@ss/word')}@localhost:6379`,
    );
  });

  it('builds a URL with user and password, encoding both', () => {
    const url = buildRedisConnectionUrl({
      host: 'localhost',
      port: 6379,
      username: 'de fault',
      password: 'p@ss/word',
    });

    expect(url).toBe(
      `redis://${encodeURIComponent('de fault')}:${encodeURIComponent('p@ss/word')}@localhost:6379`,
    );
  });
});

describe('buildRedisClientOptions', () => {
  it('omits username/password when not provided', () => {
    const options = buildRedisClientOptions({ host: 'localhost', port: 6379 });

    expect(options).toEqual({
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
    });
  });

  it('includes username/password when provided', () => {
    const options = buildRedisClientOptions({
      host: 'localhost',
      port: 6379,
      username: 'default',
      password: 'secret',
    });

    expect(options).toEqual({
      host: 'localhost',
      port: 6379,
      username: 'default',
      password: 'secret',
      lazyConnect: true,
    });
  });
});
