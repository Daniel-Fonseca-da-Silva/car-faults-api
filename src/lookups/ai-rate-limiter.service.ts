import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { errorMessage } from '../redis/redis-error.util';
import { REDIS_CLIENT } from '../redis/redis.constants';

const AI_MOBILE_THROTTLE_KEY_PREFIX = 'throttle:ai:mobile:';

/**
 * Dedicated rate limiter for AI invocations triggered by the mobile client,
 * which skips Turnstile. Only called from the AI generate/translate paths,
 * never on cache or DB hits. Fails open on Redis errors, matching the lookup
 * cache's error-handling in LookupsService.
 */
@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger(AiRateLimiterService.name);
  private readonly ttlMs: number;
  private readonly limit: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttlMs = Number(config.getOrThrow<string>('THROTTLE_AI_MOBILE_TTL_MS'));
    this.limit = Number(config.getOrThrow<string>('THROTTLE_AI_MOBILE_LIMIT'));
  }

  async assertAllowed(clientIp?: string): Promise<void> {
    const key = `${AI_MOBILE_THROTTLE_KEY_PREFIX}${clientIp ?? 'unknown'}`;
    const count = await this.increment(key);
    if (count !== undefined && count > this.limit) {
      throw new ThrottlerException(
        'Too many AI requests from this device, please try again later',
      );
    }
  }

  private async increment(key: string): Promise<number | undefined> {
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.pexpire(key, this.ttlMs);
      }
      return count;
    } catch (err) {
      this.logger.warn(
        `AI mobile throttle increment failed for key ${key}: ${errorMessage(err)}`,
      );
      return undefined;
    }
  }
}
