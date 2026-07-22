import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const MIN_YEAR = 1900;
const NAME_MAX_LENGTH = 120;
const MIN_DOORS = 1;
const MAX_DOORS = 6;

export class CreateUserVehicleDto {
  @ApiPropertyOptional({
    description:
      'Catalog vehicle model to link. When set, brand/model/engine/doors are taken from the catalog.',
    example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsOptional()
  @IsUUID()
  vehicleModelId?: string;

  @ApiPropertyOptional({
    description: 'Required when vehicleModelId is not provided.',
    example: 'Volkswagen',
  })
  @ValidateIf((dto: CreateUserVehicleDto) => !dto.vehicleModelId)
  @IsString()
  @MinLength(1)
  brand?: string;

  @ApiPropertyOptional({
    description: 'Required when vehicleModelId is not provided.',
    example: 'Polo',
  })
  @ValidateIf((dto: CreateUserVehicleDto) => !dto.vehicleModelId)
  @IsString()
  @MinLength(1)
  model?: string;

  @ApiProperty({ example: 2001 })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  year: number;

  @ApiPropertyOptional({
    description: 'Required when vehicleModelId is not provided.',
    example: '1.0',
  })
  @ValidateIf((dto: CreateUserVehicleDto) => !dto.vehicleModelId)
  @IsString()
  @MinLength(1)
  engine?: string;

  @ApiPropertyOptional({ example: 'Meu Polo', maxLength: NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Ignored when vehicleModelId is provided.',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_DOORS)
  @Max(MAX_DOORS)
  doors?: number;
}
