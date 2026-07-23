import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RedisHealthIndicator } from '../redis/redis-health.indicator';
import { RedisModule } from '../redis/redis.module';
import { HealthModule } from './health.module';
import { HealthController } from './health.controller';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useValue: { ping: jest.fn().mockResolvedValue('PONG') },
    },
  ],
  exports: [REDIS_CLIENT],
})
class RedisModuleStub {}

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule],
    })
      .overrideModule(RedisModule)
      .useModule(RedisModuleStub)
      .compile();
  });

  it('should be defined', () => {
    expect(module.get(HealthModule)).toBeDefined();
  });

  it('should provide HealthController', () => {
    expect(module.get(HealthController)).toBeDefined();
  });

  it('should provide RedisHealthIndicator', () => {
    expect(module.get(RedisHealthIndicator)).toBeDefined();
  });
});
