import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { TopFaultRow } from '../../known-issues/known-issues.repository';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

export class TopFaultVehicleDto {
  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Golf' })
  model: string;

  @ApiProperty({ example: 2015 })
  yearFrom: number;

  @ApiProperty({ example: '1.6 TDI' })
  engine: string;

  @ApiPropertyOptional({
    description: 'Omitted when the vehicle model has no fuel type on record.',
    enum: FuelType,
    example: FuelType.DIESEL,
  })
  fuelType?: FuelType;

  @ApiPropertyOptional({
    description: 'Omitted when the vehicle model has no door count on record.',
    example: 5,
  })
  doors?: number;

  constructor(row: TopFaultRow) {
    this.brand = row.vehicleBrand;
    this.model = row.vehicleModel;
    this.yearFrom = row.vehicleYearFrom;
    this.engine = row.vehicleEngine;
    this.fuelType = row.vehicleFuelType ?? undefined;
    this.doors = row.vehicleDoors ?? undefined;
  }
}
