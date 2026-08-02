import { ApiProperty } from '@nestjs/swagger';

export interface PlatformStats {
  reportsCount: number;
  vehiclesCount: number;
  faultsCount: number;
}

export class PlatformStatsResponseDto {
  @ApiProperty({ example: 128340 })
  reportsCount: number;

  @ApiProperty({ example: 8400 })
  vehiclesCount: number;

  @ApiProperty({ example: 34000 })
  faultsCount: number;

  constructor(stats: PlatformStats) {
    this.reportsCount = stats.reportsCount;
    this.vehiclesCount = stats.vehiclesCount;
    this.faultsCount = stats.faultsCount;
  }
}
