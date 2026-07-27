import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import { ActivityLogType } from '../enums/activity-log-type.enum';

const CREATABLE_ACTIVITY_LOG_TYPES = [
  ActivityLogType.DEFECT_CONSULTED,
  ActivityLogType.VEHICLE_FAVORITE,
];

export class CreateActivityLogDto {
  @ApiProperty({
    enum: CREATABLE_ACTIVITY_LOG_TYPES,
    example: ActivityLogType.DEFECT_CONSULTED,
  })
  @IsIn(CREATABLE_ACTIVITY_LOG_TYPES)
  type: ActivityLogType;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  resourceId: string;
}
