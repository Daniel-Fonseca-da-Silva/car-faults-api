import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { CommentsService } from '../comments/comments.service';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { errorMessage } from '../redis/redis-error.util';
import {
  PLATFORM_STATS_CACHE_KEY,
  platformTopFaultsCacheKey,
} from '../redis/redis.constants';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { PlatformStats } from './dto/platform-stats-response.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);
  private readonly cacheTtlMs: number;

  constructor(
    private readonly commentsService: CommentsService,
    private readonly vehicleModelsService: VehicleModelsService,
    private readonly knownIssuesService: KnownIssuesService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    config: ConfigService,
  ) {
    this.cacheTtlMs = Number(
      config.getOrThrow<string>('REDIS_PLATFORM_CACHE_TTL_MS'),
    );
  }

  async getStats(): Promise<PlatformStats> {
    const cached = await this.getCached<PlatformStats>(
      PLATFORM_STATS_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const [reportsCount, vehiclesCount, faultsCount] = await Promise.all([
      this.commentsService.countAll(),
      this.vehicleModelsService.countAll(),
      this.knownIssuesService.countAll(),
    ]);
    const stats: PlatformStats = { reportsCount, vehiclesCount, faultsCount };

    await this.setCached(PLATFORM_STATS_CACHE_KEY, stats);
    return stats;
  }

  async getTopFaults(
    locale: LookupLocale,
    limit: number,
  ): Promise<TopFaultRow[]> {
    const cacheKey = platformTopFaultsCacheKey(locale, limit);
    const cached = await this.getCached<TopFaultRow[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.knownIssuesService.findTopByCommentCount(
      locale,
      limit,
    );
    await this.setCached(cacheKey, items);
    return items;
  }

  private async getCached<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (err) {
      this.logger.warn(`Cache get failed for key ${key}: ${errorMessage(err)}`);
      return undefined;
    }
  }

  private async setCached<T>(key: string, value: T): Promise<void> {
    try {
      await this.cache.set(key, value, this.cacheTtlMs);
    } catch (err) {
      this.logger.warn(`Cache set failed for key ${key}: ${errorMessage(err)}`);
    }
  }
}
