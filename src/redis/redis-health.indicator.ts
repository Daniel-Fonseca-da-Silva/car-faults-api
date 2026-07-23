import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const check = this.healthIndicatorService.check(key);

    try {
      await this.redisClient.ping();
    } catch (err) {
      return check.down(err instanceof Error ? err.message : 'ping failed');
    }

    return check.up();
  }
}
