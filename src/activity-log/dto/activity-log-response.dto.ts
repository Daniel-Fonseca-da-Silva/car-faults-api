import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogType } from '../enums/activity-log-type.enum';

export class ActivityLogResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @Expose()
  id: string;

  @ApiProperty({
    enum: ActivityLogType,
    example: ActivityLogType.VEHICLE_FAVORITE,
  })
  @Expose()
  type: ActivityLogType;

  @ApiPropertyOptional({
    example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    nullable: true,
  })
  @Expose()
  resourceId: string | null;

  @ApiProperty({ example: '2026-07-27T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  constructor(activityLog: ActivityLog) {
    this.id = activityLog.id;
    this.type = activityLog.type;
    this.resourceId = activityLog.resourceId;
    this.createdAt = activityLog.createdAt;
  }
}
