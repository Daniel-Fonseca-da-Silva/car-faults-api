import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';

export const TOP_FAULTS_DEFAULT_LIMIT = 6;
export const TOP_FAULTS_MAX_LIMIT = 12;

export class TopFaultsQueryDto {
  @ApiPropertyOptional({
    description: 'Optional. Defaults to en-GB when omitted.',
    enum: LookupLocale,
    example: LookupLocale.EnGb,
  })
  @IsOptional()
  @IsEnum(LookupLocale)
  locale?: LookupLocale;

  @ApiPropertyOptional({
    example: TOP_FAULTS_DEFAULT_LIMIT,
    minimum: 1,
    maximum: TOP_FAULTS_MAX_LIMIT,
    default: TOP_FAULTS_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TOP_FAULTS_MAX_LIMIT)
  limit?: number;
}
