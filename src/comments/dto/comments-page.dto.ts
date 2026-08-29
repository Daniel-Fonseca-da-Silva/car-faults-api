import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { CommentResponseDto } from './comment-response.dto';

export class CommentsPageDto extends CursorPageDto<CommentResponseDto> {
  @ApiProperty({ type: [CommentResponseDto] })
  declare items: CommentResponseDto[];

  @ApiProperty({ nullable: true, example: null })
  declare nextCursor: string | null;

  constructor(items: CommentResponseDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
