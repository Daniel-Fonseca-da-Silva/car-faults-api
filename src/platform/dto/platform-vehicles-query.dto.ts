import { ApiPropertyOptional } from '@nestjs/swagger';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import {
  VEHICLES_DEFAULT_LIMIT,
  VEHICLES_MAX_LIMIT,
} from '../platform.constants';

export class PlatformVehiclesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: `Defaults to ${VEHICLES_DEFAULT_LIMIT}, capped at ${VEHICLES_MAX_LIMIT}.`,
    example: VEHICLES_DEFAULT_LIMIT,
  })
  declare limit?: number;
}
