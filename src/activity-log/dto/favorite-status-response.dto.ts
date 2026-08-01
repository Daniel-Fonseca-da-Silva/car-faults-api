import { ApiProperty } from '@nestjs/swagger';

export class FavoriteStatusResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  vehicleModelId: string;

  @ApiProperty({ example: true })
  favorited: boolean;

  constructor(vehicleModelId: string, favorited: boolean) {
    this.vehicleModelId = vehicleModelId;
    this.favorited = favorited;
  }
}
