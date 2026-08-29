import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { PlatformVehicleItemDto } from './platform-vehicle-item.dto';

export class PlatformVehiclesResponseDto extends CursorPageDto<PlatformVehicleItemDto> {
  @ApiProperty({ type: [PlatformVehicleItemDto] })
  declare items: PlatformVehicleItemDto[];

  @ApiProperty({ nullable: true, example: null })
  declare nextCursor: string | null;

  constructor(items: PlatformVehicleItemDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
