import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityLogType } from '../activity-log/enums/activity-log-type.enum';
import { FixVoteValue } from '../fixes/enums/fix-vote-value.enum';
import { FixesService } from '../fixes/fixes.service';
import { errorMessage } from '../redis/redis-error.util';
import { userStatsCacheKey } from '../redis/redis.constants';
import { UserVehiclesService } from '../user-vehicles/user-vehicles.service';

export interface UserStats {
  searchesCount: number;
  defectsConsultedCount: number;
  savedVehiclesCount: number;
  votesCount: number;
  dislikesCount: number;
  favoritedVehiclesCount: number;
}

@Injectable()
export class UserStatsService {
  private readonly logger = new Logger(UserStatsService.name);
  private readonly cacheTtlMs: number;

  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly userVehiclesService: UserVehiclesService,
    private readonly fixesService: FixesService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    config: ConfigService,
  ) {
    this.cacheTtlMs = Number(
      config.getOrThrow<string>('REDIS_USER_STATS_CACHE_TTL_MS'),
    );
  }

  async getStats(userId: string): Promise<UserStats> {
    const cacheKey = userStatsCacheKey(userId);
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.aggregate(userId);
    await this.setCached(cacheKey, stats);
    return stats;
  }

  private async aggregate(userId: string): Promise<UserStats> {
    const [
      searchesCount,
      defectsConsultedCount,
      favoritedVehiclesCount,
      savedVehiclesCount,
      votesCount,
      dislikesCount,
    ] = await Promise.all([
      this.activityLogService.countByUserAndType(
        userId,
        ActivityLogType.SEARCH,
      ),
      this.activityLogService.countByUserAndType(
        userId,
        ActivityLogType.DEFECT_CONSULTED,
      ),
      this.activityLogService.countByUserAndType(
        userId,
        ActivityLogType.VEHICLE_FAVORITE,
      ),
      this.userVehiclesService.countByUser(userId),
      this.fixesService.countVotesByUser(userId, FixVoteValue.LIKE),
      this.fixesService.countVotesByUser(userId, FixVoteValue.DISLIKE),
    ]);

    return {
      searchesCount,
      defectsConsultedCount,
      savedVehiclesCount,
      votesCount,
      dislikesCount,
      favoritedVehiclesCount,
    };
  }

  private async getCached(key: string): Promise<UserStats | undefined> {
    try {
      return await this.cache.get<UserStats>(key);
    } catch (err) {
      this.logger.warn(`Cache get failed for key ${key}: ${errorMessage(err)}`);
      return undefined;
    }
  }

  private async setCached(key: string, stats: UserStats): Promise<void> {
    try {
      await this.cache.set(key, stats, this.cacheTtlMs);
    } catch (err) {
      this.logger.warn(`Cache set failed for key ${key}: ${errorMessage(err)}`);
    }
  }
}
