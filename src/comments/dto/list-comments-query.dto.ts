import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import {
  COMMENTS_DEFAULT_LIMIT,
  COMMENTS_MAX_LIMIT,
} from '../comments.service';

export class ListCommentsQueryDto extends CursorPaginationQueryDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;

  @ApiPropertyOptional({
    description: `Defaults to ${COMMENTS_DEFAULT_LIMIT}, capped at ${COMMENTS_MAX_LIMIT}.`,
    example: COMMENTS_DEFAULT_LIMIT,
  })
  declare limit?: number;
}
