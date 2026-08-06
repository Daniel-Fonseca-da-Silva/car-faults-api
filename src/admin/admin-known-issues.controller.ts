import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { AdminCreateKnownIssueDto } from './dto/create-known-issue.dto';
import {
  AdminKnownIssueDetailResponseDto,
  AdminKnownIssueResponseDto,
} from './dto/known-issue-admin-response.dto';
import { AdminListKnownIssuesQueryDto } from './dto/list-known-issues-query.dto';
import { AdminUpdateKnownIssueDto } from './dto/update-known-issue.dto';

@ApiTags('admin-known-issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/known-issues')
export class AdminKnownIssuesController {
  constructor(private readonly knownIssuesService: KnownIssuesService) {}

  @Get()
  @ApiOperation({ summary: 'List known issues for a vehicle model' })
  @ApiOkResponse({ type: [AdminKnownIssueResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async findAll(
    @Query() query: AdminListKnownIssuesQueryDto,
  ): Promise<AdminKnownIssueResponseDto[]> {
    const knownIssues = await this.knownIssuesService.findByVehicleModelId(
      query.vehicleModelId,
    );
    return knownIssues.map(
      (knownIssue) => new AdminKnownIssueResponseDto(knownIssue),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a known issue and its fixes' })
  @ApiOkResponse({ type: AdminKnownIssueDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async findOne(
    @Param('id') id: string,
  ): Promise<AdminKnownIssueDetailResponseDto> {
    const knownIssue = await this.knownIssuesService.findByIdWithFixes(id);
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${id} not found`);
    }
    return new AdminKnownIssueDetailResponseDto(knownIssue);
  }

  @Post()
  @ApiOperation({ summary: 'Create a known issue for a vehicle model' })
  @ApiOkResponse({ type: AdminKnownIssueResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Vehicle model not found' })
  async create(
    @Body() dto: AdminCreateKnownIssueDto,
  ): Promise<AdminKnownIssueResponseDto> {
    const knownIssue = await this.knownIssuesService.create(dto);
    return new AdminKnownIssueResponseDto(knownIssue);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a known issue' })
  @ApiOkResponse({ type: AdminKnownIssueResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateKnownIssueDto,
  ): Promise<AdminKnownIssueResponseDto> {
    const knownIssue = await this.knownIssuesService.update(id, dto);
    return new AdminKnownIssueResponseDto(knownIssue);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a known issue' })
  @ApiNoContentResponse({ description: 'Known issue removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.knownIssuesService.softDelete(id);
  }
}
