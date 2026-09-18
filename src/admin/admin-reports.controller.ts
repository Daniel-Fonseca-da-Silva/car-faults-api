import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from '../reports/reports.service';
import {
  AdminReportResponseDto,
  AdminReportsPageDto,
} from './dto/report-admin-response.dto';
import { AdminListReportsQueryDto } from './dto/list-reports-query.dto';
import { AdminUpdateReportStatusDto } from './dto/update-report-status.dto';

@ApiTags('admin-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List content reports' })
  @ApiOkResponse({ type: AdminReportsPageDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Invalid cursor or validation failed' })
  async findAll(
    @Query() query: AdminListReportsQueryDto,
  ): Promise<AdminReportsPageDto> {
    const { items, nextCursor } = await this.reportsService.findPage(query);
    return new AdminReportsPageDto(items, nextCursor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Resolve or dismiss a report' })
  @ApiOkResponse({ type: AdminReportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateReportStatusDto,
  ): Promise<AdminReportResponseDto> {
    const report = await this.reportsService.updateStatus(id, dto.status);
    return new AdminReportResponseDto(report, null, true);
  }

  @Delete(':id/content')
  @ApiOperation({
    summary: 'Delete the reported comment/review and mark the report reviewed',
  })
  @ApiOkResponse({ type: AdminReportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({
    description: 'Report not found, or its content was already removed',
  })
  async removeContent(
    @Param('id') id: string,
  ): Promise<AdminReportResponseDto> {
    const report = await this.reportsService.removeContent(id);
    return new AdminReportResponseDto(report, null, false);
  }
}
