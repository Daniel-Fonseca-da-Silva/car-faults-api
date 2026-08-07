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
import { FixesService } from '../fixes/fixes.service';
import { AdminFixResponseDto } from './dto/fix-admin-response.dto';
import { AdminCreateFixDto } from './dto/create-fix.dto';
import { AdminUpdateFixDto } from './dto/update-fix.dto';

@ApiTags('admin-fixes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/fixes')
export class AdminFixesController {
  constructor(private readonly fixesService: FixesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a fix' })
  @ApiOkResponse({ type: AdminFixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async findOne(@Param('id') id: string): Promise<AdminFixResponseDto> {
    const fix = await this.fixesService.findById(id);
    if (!fix) {
      throw new NotFoundException(`Fix ${id} not found`);
    }
    return new AdminFixResponseDto(fix);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fix for a known issue' })
  @ApiOkResponse({ type: AdminFixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async create(@Body() dto: AdminCreateFixDto): Promise<AdminFixResponseDto> {
    const fix = await this.fixesService.adminCreate(dto);
    return new AdminFixResponseDto(fix);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fix' })
  @ApiOkResponse({ type: AdminFixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateFixDto,
  ): Promise<AdminFixResponseDto> {
    const fix = await this.fixesService.adminUpdate(id, dto);
    return new AdminFixResponseDto(fix);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a fix' })
  @ApiNoContentResponse({ description: 'Fix removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.fixesService.adminRemove(id);
  }
}
