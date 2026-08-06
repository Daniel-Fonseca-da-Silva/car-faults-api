import { ApiProperty } from '@nestjs/swagger';
import { PlatformStats } from '../platform.service';

export class PlatformStatsResponseDto {
  @ApiProperty({ example: 128 })
  reportsCount: number;

  @ApiProperty({ example: 42 })
  vehiclesCount: number;

  @ApiProperty({ example: 96 })
  faultsCount: number;

  constructor(stats: PlatformStats) {
    this.reportsCount = stats.reportsCount;
    this.vehiclesCount = stats.vehiclesCount;
    this.faultsCount = stats.faultsCount;
  }
}
