import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
import { ReportContentType } from '../enums/report-content-type.enum';
import { ReportReason } from '../enums/report-reason.enum';
import { ReportStatus } from '../enums/report-status.enum';

export class ReportResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ enum: ReportContentType, example: ReportContentType.COMMENT })
  contentType: ReportContentType;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  contentId: string;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  reason: ReportReason;

  @ApiPropertyOptional({
    example: 'Repeated ad for an unrelated product.',
    nullable: true,
  })
  details: string | null;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  constructor(report: Report) {
    this.id = report.id;
    this.contentType = report.contentType;
    this.contentId = report.contentId;
    this.reason = report.reason;
    this.details = report.details ?? null;
    this.status = report.status;
    this.createdAt = report.createdAt;
  }
}
