import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';

export class AdminCreateKnownIssueDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  vehicleModelId: string;

  @ApiProperty({ example: 'Problematic gearbox' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'Synchros wear out prematurely under normal use.' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

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
