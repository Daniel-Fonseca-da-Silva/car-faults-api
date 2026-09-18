import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../reports/enums/report-status.enum';

export class AdminUpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus, example: ReportStatus.REVIEWED })
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
