import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';
import { FAULTS_DEFAULT_LIMIT, FAULTS_MAX_LIMIT } from '../platform.constants';

const MIN_YEAR = 1900;
const MIN_DOORS = 1;
const MAX_DOORS = 6;

export class PlatformFaultsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  locale?: LookupLocale;

  @ApiPropertyOptional({
    description: `Defaults to ${FAULTS_DEFAULT_LIMIT}, capped at ${FAULTS_MAX_LIMIT}.`,
    example: FAULTS_DEFAULT_LIMIT,
  })
  declare limit?: number;

  @ApiPropertyOptional({ example: 'Volkswagen' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Golf' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  year?: number;

  @ApiPropertyOptional({ example: '1.6 TDI' })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({ enum: FuelType, example: FuelType.DIESEL })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_DOORS)
  @Max(MAX_DOORS)
  doors?: number;
}
