import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import {
  ENGINE_OPTIONS,
  MAX_ENGINE_LITRES,
  MIN_ENGINE_LITRES,
  normalizeEngine,
} from '../../common/utils/normalize-engine.util';
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

  @ApiProperty({
    description: `Displacement in litres (${MIN_ENGINE_LITRES.toFixed(1)}-${MAX_ENGINE_LITRES.toFixed(1)}) or "electric". Free text such as "1,6", "1.6 TDI" or "1598cc" is normalized to "1.6".`,
    example: '1.0',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (normalizeEngine(value) ?? value) : value,
  )
  @IsString()
  @IsIn(ENGINE_OPTIONS, {
    message: `engine must be a displacement in litres between ${MIN_ENGINE_LITRES.toFixed(1)} and ${MAX_ENGINE_LITRES.toFixed(1)} (e.g. 1.6) or "electric"`,
  })
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
