import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

export class PlatformVehicleItemDto {
  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Golf' })
  model: string;

  @ApiPropertyOptional({
    description: 'Colloquial or chassis-code display name, when recorded.',
    example: 'Polo 6N1',
  })
  name?: string;

  @ApiProperty({ example: 2018 })
  yearFrom: number;

  @ApiProperty({ example: '2.0 TDI' })
  engine: string;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  fuelType: FuelType;

  @ApiPropertyOptional({
    description: 'Omitted when the vehicle model has no door count on record.',
    example: 5,
  })
  doors?: number;

  @ApiProperty({
    enum: LookupLocale,
    isArray: true,
    description:
      'Locales with at least one known issue. Only these locales have a vehicle page ' +
      'with content, so sitemaps should list the vehicle for these locales only.',
    example: [LookupLocale.PtBr, LookupLocale.PtPt],
  })
  locales: LookupLocale[];

  @ApiProperty({
    format: 'date-time',
    description:
      'Latest change to the vehicle model, its known issues or their fixes. ' +
      'Meant for the sitemap lastmod.',
    example: '2026-10-01T12:00:00.000Z',
  })
  updatedAt: string;

  constructor(
    vehicleModel: VehicleModel,
    locales: LookupLocale[],
    updatedAt: string,
  ) {
    this.brand = vehicleModel.brand;
    this.model = vehicleModel.model;
    this.name = vehicleModel.name ?? undefined;
    this.yearFrom = vehicleModel.yearFrom;
    this.engine = vehicleModel.engine;
    // findCatalogPaginated only returns rows with a non-null fuelType
    // and at least one known issue.
    this.fuelType = vehicleModel.fuelType as FuelType;
    this.doors = vehicleModel.doors ?? undefined;
    this.locales = locales;
    this.updatedAt = updatedAt;
  }
}
