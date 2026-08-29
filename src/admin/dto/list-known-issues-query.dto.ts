import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import {
  ADMIN_KNOWN_ISSUES_DEFAULT_LIMIT,
  ADMIN_KNOWN_ISSUES_MAX_LIMIT,
} from '../../known-issues/known-issues.service';

export class AdminListKnownIssuesQueryDto extends CursorPaginationQueryDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  vehicleModelId: string;

  @ApiPropertyOptional({
    description: `Defaults to ${ADMIN_KNOWN_ISSUES_DEFAULT_LIMIT}, capped at ${ADMIN_KNOWN_ISSUES_MAX_LIMIT}.`,
    example: ADMIN_KNOWN_ISSUES_DEFAULT_LIMIT,
  })
  declare limit?: number;
}
