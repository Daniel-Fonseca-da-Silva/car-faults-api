import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from './redis.module';
import { REDIS_CLIENT } from './redis.constants';

describe('RedisModule', () => {
  it('registers CacheModule and re-exports the redis client', () => {
    const imports = Reflect.getMetadata('imports', RedisModule) as Array<{
      module?: unknown;
    }>;
    const providers = Reflect.getMetadata('providers', RedisModule) as Array<{
      provide?: unknown;
    }>;
    const exports = Reflect.getMetadata('exports', RedisModule) as
      unknown[] | undefined;

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(CacheModule);
    expect(providers.some((p) => p.provide === REDIS_CLIENT)).toBe(true);
    expect(exports).toContain(CacheModule);
    expect(exports).toContain(REDIS_CLIENT);
  });
});
