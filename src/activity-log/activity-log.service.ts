import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import { resolveLimit } from '../common/pagination/cursor-query.dto';
import { splitPage } from '../common/pagination/paginate.util';
import { errorMessage } from '../redis/redis-error.util';
import { userStatsCacheKey } from '../redis/redis.constants';
import {
  ActivityLogRepository,
  FavoriteCursor,
} from './activity-log.repository';
import {
  FAVORITES_DEFAULT_LIMIT,
  FAVORITES_MAX_LIMIT,
  FavoritesQueryDto,
} from './dto/favorites-query.dto';
import { FavoriteVehicleResponseDto } from './dto/favorite-vehicle-response.dto';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

export interface FavoritesPage {
  items: FavoriteVehicleResponseDto[];
  nextCursor: string | null;
}

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
    year: number | undefined,
  ): Promise<ActivityLog> {
    if (year === undefined) {
      throw new BadRequestException(
        'year is required to favorite a vehicle model',
      );
    }

    const existing = await this.activityLogRepository.findFavorite(
      userId,
      vehicleModelId,
      year,
    );
    if (existing) {
      return existing;
    }

    const activityLog = this.activityLogRepository.create({
      userId,
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId: vehicleModelId,
      metadata: { year },
    });
    const saved = await this.activityLogRepository.save(activityLog);
    await this.evictStatsCache(userId);
    return saved;
  }

  async unfavoriteVehicle(
    userId: string,
    vehicleModelId: string,
    year: number,
  ): Promise<void> {
    const existing = await this.activityLogRepository.findFavorite(
      userId,
      vehicleModelId,
      year,
    );
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }

    await this.activityLogRepository.softDelete({
      userId,
      resourceId: vehicleModelId,
      type: ActivityLogType.VEHICLE_FAVORITE,
      year,
    });
    await this.evictStatsCache(userId);
  }

  countByUserAndType(userId: string, type: ActivityLogType): Promise<number> {
    return this.activityLogRepository.countByUserAndType(userId, type);
  }

  async isFavorited(
    userId: string,
    vehicleModelId: string,
    year: number,
  ): Promise<boolean> {
    const existing = await this.activityLogRepository.findFavorite(
      userId,
      vehicleModelId,
      year,
    );
    return existing !== null;
  }

  async findFavorites(
    userId: string,
    query: FavoritesQueryDto,
  ): Promise<FavoritesPage> {
    const limit = resolveLimit(query.limit, {
      default: FAVORITES_DEFAULT_LIMIT,
      max: FAVORITES_MAX_LIMIT,
    });
    const cursor = query.cursor
      ? decodeCursor<FavoriteCursor>(query.cursor)
      : undefined;

    const rows = await this.activityLogRepository.findFavoritesHydrated(
      userId,
      limit,
      cursor,
    );
    const { items: pageRows, hasMore } = splitPage(rows, limit);
    const items = pageRows.map((row) => new FavoriteVehicleResponseDto(row));

    const last = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({
            createdAt: last.favoritedAt.toISOString(),
            id: last.id,
          })
        : null;

    return { items, nextCursor };
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
