import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

export interface FavoriteCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

export interface RawFavoriteRow {
  id: string;
  vehicleModelId: string;
  year: string;
  favoritedAt: Date;
  brand: string;
  model: string;
  engine: string;
  fuelType: string | null;
  doors: string | number | null;
  imageUrl: string | null;
}

@Injectable()
export class ActivityLogRepository {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repository: Repository<ActivityLog>,
  ) {}

  create(data: Partial<ActivityLog>): ActivityLog {
    return this.repository.create(data);
  }

  save(activityLog: ActivityLog): Promise<ActivityLog> {
    return this.repository.save(activityLog);
  }

  findFavorite(
    userId: string,
    resourceId: string,
    year: number,
  ): Promise<ActivityLog | null> {
    return this.repository
      .createQueryBuilder('activity_log')
      .where('activity_log.user_id = :userId', { userId })
      .andWhere('activity_log.resource_id = :resourceId', { resourceId })
      .andWhere('activity_log.type = :type', {
        type: ActivityLogType.VEHICLE_FAVORITE,
      })
      .andWhere("activity_log.metadata->>'year' = :year", {
        year: String(year),
      })
      .getOne();
  }

  findDeletedFavorite(
    userId: string,
    resourceId: string,
    year: number,
  ): Promise<ActivityLog | null> {
    return this.repository
      .createQueryBuilder('activity_log')
      .withDeleted()
      .where('activity_log.user_id = :userId', { userId })
      .andWhere('activity_log.resource_id = :resourceId', { resourceId })
      .andWhere('activity_log.type = :type', {
        type: ActivityLogType.VEHICLE_FAVORITE,
      })
      .andWhere("activity_log.metadata->>'year' = :year", {
        year: String(year),
      })
      .andWhere('activity_log.deleted_at IS NOT NULL')
      .getOne();
  }

  async restore(id: string): Promise<ActivityLog> {
    await this.repository.restore(id);
    return this.repository.findOneByOrFail({ id });
  }

  async softDelete(criteria: {
    userId: string;
    resourceId: string;
    type: ActivityLogType;
    year: number;
  }): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('user_id = :userId', { userId: criteria.userId })
      .andWhere('resource_id = :resourceId', {
        resourceId: criteria.resourceId,
      })
      .andWhere('type = :type', { type: criteria.type })
      .andWhere("metadata->>'year' = :year", { year: String(criteria.year) })
      .execute();
  }

  countByUserAndType(userId: string, type: ActivityLogType): Promise<number> {
    return this.repository.count({ where: { userId, type } });
  }

  findFavoritesHydrated(
    userId: string,
    limit: number,
    cursor?: FavoriteCursor,
  ): Promise<RawFavoriteRow[]> {
    const qb = this.repository
      .createQueryBuilder('activity_log')
      .innerJoin('vehicle_models', 'vm', 'vm.id = activity_log.resource_id')
      .select('activity_log.id', 'id')
      .addSelect('activity_log.resource_id', 'vehicleModelId')
      .addSelect("activity_log.metadata->>'year'", 'year')
      .addSelect('activity_log.created_at', 'favoritedAt')
      .addSelect('vm.brand', 'brand')
      .addSelect('vm.model', 'model')
      .addSelect('vm.engine', 'engine')
      .addSelect('vm.fuel_type', 'fuelType')
      .addSelect('vm.doors', 'doors')
      .addSelect('vm.image_url', 'imageUrl')
      .where('activity_log.user_id = :userId', { userId })
      .andWhere('activity_log.type = :type', {
        type: ActivityLogType.VEHICLE_FAVORITE,
      })
      .andWhere('activity_log.deleted_at IS NULL')
      .orderBy('activity_log.created_at', 'DESC')
      .addOrderBy('activity_log.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          {
            expr: 'activity_log.created_at',
            direction: 'DESC',
            param: 'createdAt',
          },
          { expr: 'activity_log.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getRawMany<RawFavoriteRow>();
  }
}
