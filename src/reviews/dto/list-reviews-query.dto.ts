import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import { REVIEWS_DEFAULT_LIMIT, REVIEWS_MAX_LIMIT } from '../reviews.service';

export class ListReviewsQueryDto extends CursorPaginationQueryDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;

  @ApiPropertyOptional({
    description: `Defaults to ${REVIEWS_DEFAULT_LIMIT}, capped at ${REVIEWS_MAX_LIMIT}.`,
    example: REVIEWS_DEFAULT_LIMIT,
  })
  declare limit?: number;
}
