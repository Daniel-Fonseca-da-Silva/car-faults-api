import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { TopFaultItemDto } from './top-fault-item.dto';

export class PlatformFaultsResponseDto extends CursorPageDto<TopFaultItemDto> {
  @ApiProperty({ type: [TopFaultItemDto] })
  declare items: TopFaultItemDto[];

  @ApiProperty({ nullable: true, example: null })
  declare nextCursor: string | null;

  constructor(items: TopFaultItemDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
