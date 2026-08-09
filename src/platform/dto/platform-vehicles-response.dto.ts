import { ApiProperty } from '@nestjs/swagger';
import { PlatformVehicleItemDto } from './platform-vehicle-item.dto';

export class PlatformVehiclesResponseDto {
  @ApiProperty({ type: [PlatformVehicleItemDto] })
  items: PlatformVehicleItemDto[];

  @ApiProperty({ example: 314 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;

  constructor(
    items: PlatformVehicleItemDto[],
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
