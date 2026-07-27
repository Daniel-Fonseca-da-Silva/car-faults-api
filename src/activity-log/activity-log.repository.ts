import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

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
  ): Promise<ActivityLog | null> {
    return this.repository.findOne({
      where: {
        userId,
        resourceId,
        type: ActivityLogType.VEHICLE_FAVORITE,
      },
    });
  }

  async deleteFavorite(userId: string, resourceId: string): Promise<void> {
    await this.repository.delete({
      userId,
      resourceId,
      type: ActivityLogType.VEHICLE_FAVORITE,
    });
  }

  countByUserAndType(userId: string, type: ActivityLogType): Promise<number> {
    return this.repository.count({ where: { userId, type } });
  }
}
