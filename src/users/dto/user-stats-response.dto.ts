import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserStats } from '../user-stats.service';

export class UserStatsResponseDto {
  @ApiProperty({ example: 12 })
  @Expose()
  searchesCount: number;

  @ApiProperty({ example: 5 })
  @Expose()
  defectsConsultedCount: number;

  @ApiProperty({ example: 3 })
  @Expose()
  savedVehiclesCount: number;

  @ApiProperty({ example: 8 })
  @Expose()
  votesCount: number;

  @ApiProperty({ example: 1 })
  @Expose()
  dislikesCount: number;

  @ApiProperty({ example: 2 })
  @Expose()
  favoritedVehiclesCount: number;

  constructor(stats: UserStats) {
    this.searchesCount = stats.searchesCount;
    this.defectsConsultedCount = stats.defectsConsultedCount;
    this.savedVehiclesCount = stats.savedVehiclesCount;
    this.votesCount = stats.votesCount;
    this.dislikesCount = stats.dislikesCount;
    this.favoritedVehiclesCount = stats.favoritedVehiclesCount;
  }
}
