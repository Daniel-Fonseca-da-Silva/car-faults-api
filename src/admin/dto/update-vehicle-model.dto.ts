import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { IsR2ImageUrl } from '../../comments/validators/is-r2-image-url.validator';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

export class AdminUpdateVehicleModelDto {
  @ApiPropertyOptional({ example: 'Volkswagen' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  brand?: string;

  @ApiPropertyOptional({ example: 'Polo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;

  @ApiPropertyOptional({ example: 'Polo 6N1', nullable: true })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ example: 1994 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  yearFrom?: number;

  @ApiPropertyOptional({ example: 1999, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  yearTo?: number | null;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  engine?: string;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  doors?: number | null;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.DIESEL,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/vehicles/polo.jpg',
    nullable: true,
    description: 'Pass null to remove the existing catalog photo',
  })
  @IsOptional()
  @IsR2ImageUrl()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: { power_hp: 50 }, nullable: true })
  @IsOptional()
  @IsObject()
  techSpecs?: Record<string, unknown> | null;
}
