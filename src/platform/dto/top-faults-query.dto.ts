import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import {
  TOP_FAULTS_DEFAULT_LIMIT,
  TOP_FAULTS_MAX_LIMIT,
  TOP_FAULTS_MIN_LIMIT,
} from '../platform.constants';

export class TopFaultsQueryDto {
  @ApiPropertyOptional({
    description: 'Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  locale?: LookupLocale;

  @ApiPropertyOptional({
    description: `Defaults to ${TOP_FAULTS_DEFAULT_LIMIT}, max ${TOP_FAULTS_MAX_LIMIT}.`,
    example: TOP_FAULTS_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(TOP_FAULTS_MIN_LIMIT)
  @Max(TOP_FAULTS_MAX_LIMIT)
  limit?: number;
}
