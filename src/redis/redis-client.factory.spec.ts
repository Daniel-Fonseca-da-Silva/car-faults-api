import { ConfigService } from '@nestjs/config';
import { createRedisClient } from './redis-client.factory';

describe('createRedisClient', () => {
  it('builds an ioredis client from ConfigService without connecting eagerly', () => {
    const values: Record<string, string> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const client = createRedisClient(config);

    expect(client.options.host).toBe('localhost');
    expect(client.options.port).toBe(6379);
    expect(client.options.lazyConnect).toBe(true);
  });

  it('throws when a required variable is missing', () => {
    const config = {
      getOrThrow: jest.fn(() => {
        throw new Error('REDIS_HOST is not defined');
      }),
    } as unknown as ConfigService;

    expect(() => createRedisClient(config)).toThrow(
      'REDIS_HOST is not defined',
    );
  });
});
