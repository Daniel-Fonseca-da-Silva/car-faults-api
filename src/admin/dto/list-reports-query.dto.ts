import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';
import { ReportStatus } from '../../reports/enums/report-status.enum';
import {
  REPORTS_DEFAULT_LIMIT,
  REPORTS_MAX_LIMIT,
} from '../../reports/reports.service';

export class AdminListReportsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus, example: ReportStatus.PENDING })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: `Defaults to ${REPORTS_DEFAULT_LIMIT}, capped at ${REPORTS_MAX_LIMIT}.`,
    example: REPORTS_DEFAULT_LIMIT,
  })
  declare limit?: number;
}
