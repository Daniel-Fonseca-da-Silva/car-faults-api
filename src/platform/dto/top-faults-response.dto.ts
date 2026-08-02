import { ApiProperty } from '@nestjs/swagger';
import { TopFaultItemDto } from './top-fault-item.dto';

export class TopFaultsResponseDto {
  @ApiProperty({ type: [TopFaultItemDto] })
  items: TopFaultItemDto[];

  constructor(items: TopFaultItemDto[]) {
    this.items = items;
  }
}
