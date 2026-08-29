import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';
import { RawFavoriteRow } from '../activity-log.repository';

export class FavoriteVehicleResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  vehicleModelId: string;

  @ApiProperty({ example: 2001 })
  year: number;

  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Polo' })
  model: string;

  @ApiProperty({ example: '1.0' })
  engine: string;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.GASOLINE,
    nullable: true,
  })
  fuelType: FuelType | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  doors: number | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/vehicle-models/vw-polo.webp',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ example: '2026-07-27T10:00:00.000Z' })
  favoritedAt: Date;

  constructor(row: RawFavoriteRow) {
    this.id = row.id;
    this.vehicleModelId = row.vehicleModelId;
    this.year = Number(row.year);
    this.brand = row.brand;
    this.model = row.model;
    this.engine = row.engine;
    this.fuelType = (row.fuelType as FuelType | null) ?? null;
    this.doors = row.doors == null ? null : Number(row.doors);
    this.imageUrl = row.imageUrl;
    this.favoritedAt = row.favoritedAt;
  }
}
