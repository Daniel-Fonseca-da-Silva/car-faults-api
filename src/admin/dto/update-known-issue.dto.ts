import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';

export class AdminUpdateKnownIssueDto {
  @ApiPropertyOptional({ example: 'Problematic gearbox' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({
    example: 'Synchros wear out prematurely under normal use.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ enum: LookupLocale, example: LookupLocale.EnGb })
  @IsOptional()
  @IsEnum(LookupLocale)
  locale?: LookupLocale;

  @ApiPropertyOptional({ example: 120000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  typicalKm?: number | null;

  @ApiPropertyOptional({ example: ['https://example.com'], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  sources?: string[] | null;
}
