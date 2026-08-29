import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { ReviewResponseDto } from './review-response.dto';

export class ReviewsPageDto extends CursorPageDto<ReviewResponseDto> {
  @ApiProperty({ type: [ReviewResponseDto] })
  declare items: ReviewResponseDto[];

  @ApiProperty({
    description:
      'Opaque cursor for the next page; null when there is no next page.',
    nullable: true,
    example: null,
  })
  declare nextCursor: string | null;

  constructor(items: ReviewResponseDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
