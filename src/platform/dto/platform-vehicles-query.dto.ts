import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  VEHICLES_DEFAULT_LIMIT,
  VEHICLES_DEFAULT_PAGE,
  VEHICLES_MAX_LIMIT,
  VEHICLES_MIN_LIMIT,
} from '../platform.constants';

export class PlatformVehiclesQueryDto {
  @ApiPropertyOptional({
    description: `Defaults to ${VEHICLES_DEFAULT_PAGE}.`,
    example: VEHICLES_DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: `Defaults to ${VEHICLES_DEFAULT_LIMIT}, max ${VEHICLES_MAX_LIMIT}.`,
    example: VEHICLES_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VEHICLES_MIN_LIMIT)
  @Max(VEHICLES_MAX_LIMIT)
  limit?: number;
}
