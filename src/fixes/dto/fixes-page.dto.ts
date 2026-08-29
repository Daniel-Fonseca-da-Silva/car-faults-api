import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { FixResponseDto } from './fix-response.dto';

export class FixesPageDto extends CursorPageDto<FixResponseDto> {
  @ApiProperty({ type: [FixResponseDto] })
  declare items: FixResponseDto[];

  @ApiProperty({ nullable: true, example: null })
  declare nextCursor: string | null;

  constructor(items: FixResponseDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
