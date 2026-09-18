import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ReportContentType } from '../enums/report-content-type.enum';
import { ReportReason } from '../enums/report-reason.enum';

export class CreateReportDto {
  @ApiProperty({
    enum: ReportContentType,
    example: ReportContentType.COMMENT,
  })
  @IsEnum(ReportContentType)
  contentType: ReportContentType;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    example: 'Repeated ad for an unrelated product.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
