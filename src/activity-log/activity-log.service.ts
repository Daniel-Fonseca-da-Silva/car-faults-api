import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { errorMessage } from '../redis/redis-error.util';
import { userStatsCacheKey } from '../redis/redis.constants';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    private readonly activityLogRepository: ActivityLogRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async recordSearch(
    userId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      const activityLog = this.activityLogRepository.create({
        userId,
        type: ActivityLogType.SEARCH,
        metadata,
      });
      await this.activityLogRepository.save(activityLog);
      await this.evictStatsCache(userId);
    } catch (err) {
      this.logger.warn(
        `Failed to record search activity for user ${userId}: ${errorMessage(err)}`,
      );
    }
  }

  async recordDefectConsulted(
    userId: string,
    knownIssueId: string,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      userId,
      type: ActivityLogType.DEFECT_CONSULTED,
      resourceId: knownIssueId,
    });
    const saved = await this.activityLogRepository.save(activityLog);
    await this.evictStatsCache(userId);
    return saved;
  }

  async favoriteVehicle(
    userId: string,
    vehicleModelId: string,
  ): Promise<ActivityLog> {
    const existing = await this.activityLogRepository.findFavorite(
      userId,
      vehicleModelId,
    );
    if (existing) {
      return existing;
    }

    const activityLog = this.activityLogRepository.create({
      userId,
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId: vehicleModelId,
    });
    const saved = await this.activityLogRepository.save(activityLog);
    await this.evictStatsCache(userId);
    return saved;
  }

  async unfavoriteVehicle(
    userId: string,
    vehicleModelId: string,
  ): Promise<void> {
    const existing = await this.activityLogRepository.findFavorite(
      userId,
      vehicleModelId,
    );
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }

    await this.activityLogRepository.softDelete({
      userId,
      resourceId: vehicleModelId,
      type: ActivityLogType.VEHICLE_FAVORITE,
    });
    await this.evictStatsCache(userId);
  }

  countByUserAndType(userId: string, type: ActivityLogType): Promise<number> {
    return this.activityLogRepository.countByUserAndType(userId, type);
  }

  private async evictStatsCache(userId: string): Promise<void> {
    const key = userStatsCacheKey(userId);
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for key ${key}: ${errorMessage(err)}`,
      );
    }
  }
}
