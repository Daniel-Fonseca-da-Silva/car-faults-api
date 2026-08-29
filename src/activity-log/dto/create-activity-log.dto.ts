import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ActivityLogType } from '../enums/activity-log-type.enum';

const CREATABLE_ACTIVITY_LOG_TYPES = [
  ActivityLogType.DEFECT_CONSULTED,
  ActivityLogType.VEHICLE_FAVORITE,
];
const MIN_YEAR = 1900;

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

  @ApiPropertyOptional({
    description:
      'Required when type is vehicle_favorite: the concrete model year being favorited.',
    example: 2001,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  year?: number;
}
