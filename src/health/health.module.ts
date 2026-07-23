import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from '../redis/redis-health.indicator';
import { RedisModule } from '../redis/redis.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, RedisModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
