import { ConfigService } from '@nestjs/config';
import { createRedisCacheOptions } from './redis-cache.options.factory';

describe('createRedisCacheOptions', () => {
  it('builds cache module options from ConfigService', () => {
    const values: Record<string, string> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_USER_CACHE_TTL_MS: '300000',
    };
    const config = {
      getOrThrow: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    const options = createRedisCacheOptions(config);

    expect(options.ttl).toBe(300000);
    expect(options.stores).toHaveLength(1);
  });

  it('throws when a required variable is missing', () => {
    const config = {
      getOrThrow: jest.fn(() => {
        throw new Error('REDIS_HOST is not defined');
      }),
    } as unknown as ConfigService;

    expect(() => createRedisCacheOptions(config)).toThrow(
      'REDIS_HOST is not defined',
    );
  });
});
