import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisCacheOptions } from './redis-cache.options.factory';
import { createRedisClient } from './redis-client.factory';
import { REDIS_CLIENT } from './redis.constants';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: createRedisCacheOptions,
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: createRedisClient,
    },
  ],
  exports: [CacheModule, REDIS_CLIENT],
})
export class RedisModule {}
