import { ApiProperty } from '@nestjs/swagger';
import { TopFaultItemDto } from './top-fault-item.dto';

export class PlatformFaultsResponseDto {
  @ApiProperty({ type: [TopFaultItemDto] })
  items: TopFaultItemDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 9 })
  limit: number;

  constructor(
    items: TopFaultItemDto[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
