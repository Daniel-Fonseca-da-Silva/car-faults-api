import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

export class AdminVehicleModelResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Polo' })
  model: string;

  @ApiPropertyOptional({ example: 'Polo 6N1', nullable: true })
  name: string | null;

  @ApiProperty({ example: 1994 })
  yearFrom: number;

  @ApiPropertyOptional({ example: 1999, nullable: true })
  yearTo: number | null;

  @ApiProperty({ example: '1.0' })
  engine: string;

  @ApiPropertyOptional({ example: 3, nullable: true })
  doors: number | null;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.DIESEL,
    nullable: true,
  })
  fuelType: FuelType | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/vehicles/polo.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiPropertyOptional({ example: { power_hp: 50 }, nullable: true })
  techSpecs: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(vehicleModel: VehicleModel) {
    this.id = vehicleModel.id;
    this.brand = vehicleModel.brand;
    this.model = vehicleModel.model;
    this.name = vehicleModel.name;
    this.yearFrom = vehicleModel.yearFrom;
    this.yearTo = vehicleModel.yearTo;
    this.engine = vehicleModel.engine;
    this.doors = vehicleModel.doors;
    this.fuelType = vehicleModel.fuelType;
    this.imageUrl = vehicleModel.imageUrl;
    this.techSpecs = vehicleModel.techSpecs;
    this.createdAt = vehicleModel.createdAt;
    this.updatedAt = vehicleModel.updatedAt;
  }
}

export class AdminVehicleModelListResponseDto {
  @ApiProperty({ type: [AdminVehicleModelResponseDto] })
  items: AdminVehicleModelResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  constructor(
    vehicleModels: VehicleModel[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.items = vehicleModels.map(
      (vehicleModel) => new AdminVehicleModelResponseDto(vehicleModel),
    );
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
