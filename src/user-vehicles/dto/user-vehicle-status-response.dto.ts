import { ApiProperty } from '@nestjs/swagger';

export class UserVehicleStatusResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  vehicleModelId: string;

  @ApiProperty({ example: 2001 })
  year: number;

  @ApiProperty({ example: true })
  owned: boolean;

  constructor(vehicleModelId: string, year: number, owned: boolean) {
    this.vehicleModelId = vehicleModelId;
    this.year = year;
    this.owned = owned;
  }
}
