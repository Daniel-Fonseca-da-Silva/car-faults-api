import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

const MIN_YEAR = 1900;
const MIN_DOORS = 1;
const MAX_DOORS = 6;

export class LookupQueryDto {
  @ApiProperty({ example: 'Volkswagen' })
  @IsString()
  @MinLength(1)
  brand: string;

  @ApiProperty({ example: 'Polo' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiProperty({ example: 2001 })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  year: number;

  @ApiProperty({ example: '1.0' })
  @IsString()
  @MinLength(1)
  engine: string;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiPropertyOptional({
    description:
      'Optional. When present, doors becomes part of the lookup identity (e.g. Polo 3-door vs Polo 5-door).',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_DOORS)
  @Max(MAX_DOORS)
  doors?: number;

  @ApiPropertyOptional({
    description: 'Optional. Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  language?: LookupLocale;
}
