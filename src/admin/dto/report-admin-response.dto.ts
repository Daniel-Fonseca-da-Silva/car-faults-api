import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { Report } from '../../reports/entities/report.entity';
import { ReportContentType } from '../../reports/enums/report-content-type.enum';
import { ReportReason } from '../../reports/enums/report-reason.enum';
import { ReportStatus } from '../../reports/enums/report-status.enum';
import { ReportListItem } from '../../reports/reports.service';

export class AdminReportResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  reporterUserId: string;

  @ApiProperty({ enum: ReportContentType, example: ReportContentType.COMMENT })
  contentType: ReportContentType;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  contentId: string;

  @ApiPropertyOptional({
    example: 'Repeated ad for an unrelated product.',
    nullable: true,
    description:
      'Body text of the reported comment/review. Null if it has no text or was since deleted; see contentExists.',
  })
  contentPreview: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the reported comment/review still exists.',
  })
  contentExists: boolean;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  reason: ReportReason;

  @ApiPropertyOptional({ nullable: true })
  details: string | null;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  constructor(
    report: Report,
    contentPreview: string | null,
    contentExists: boolean,
  ) {
    this.id = report.id;
    this.reporterUserId = report.reporterUserId;
    this.contentType = report.contentType;
    this.contentId = report.contentId;
    this.contentPreview = contentPreview;
    this.contentExists = contentExists;
    this.reason = report.reason;
    this.details = report.details;
    this.status = report.status;
    this.createdAt = report.createdAt;
  }
}

export class AdminReportsPageDto extends CursorPageDto<AdminReportResponseDto> {
  @ApiProperty({ type: [AdminReportResponseDto] })
  declare items: AdminReportResponseDto[];

  @ApiProperty({
    description:
      'Opaque cursor for the next page; null when there is no next page.',
    nullable: true,
    example: null,
  })
  declare nextCursor: string | null;

  constructor(items: ReportListItem[], nextCursor: string | null) {
    super(
      items.map(
        (item) =>
          new AdminReportResponseDto(
            item.report,
            item.contentPreview,
            item.contentExists,
          ),
      ),
      nextCursor,
    );
  }
}
