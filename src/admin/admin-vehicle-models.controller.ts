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
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { AdminCreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { AdminListVehicleModelsQueryDto } from './dto/list-vehicle-models-query.dto';
import { AdminUpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { AdminVehicleModelDetailQueryDto } from './dto/vehicle-model-detail-query.dto';
import { AdminVehicleModelDetailResponseDto } from './dto/vehicle-model-detail-response.dto';
import {
  AdminVehicleModelListResponseDto,
  AdminVehicleModelResponseDto,
} from './dto/vehicle-model-admin-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@ApiTags('admin-vehicle-models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/vehicle-models')
export class AdminVehicleModelsController {
  constructor(
    private readonly vehicleModelsService: VehicleModelsService,
    private readonly knownIssuesService: KnownIssuesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List vehicle models in the catalog' })
  @ApiOkResponse({ type: AdminVehicleModelListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async findAll(
    @Query() query: AdminListVehicleModelsQueryDto,
  ): Promise<AdminVehicleModelListResponseDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const { items, total } = await this.vehicleModelsService.findPaginated({
      page,
      limit,
      brand: query.brand,
      model: query.model,
    });
    return new AdminVehicleModelListResponseDto(items, total, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle model and its known issues' })
  @ApiOkResponse({ type: AdminVehicleModelDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Vehicle model not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: AdminVehicleModelDetailQueryDto,
  ): Promise<AdminVehicleModelDetailResponseDto> {
    const vehicleModel = await this.vehicleModelsService.findById(id);
    if (!vehicleModel) {
      throw new NotFoundException(`Vehicle model ${id} not found`);
    }

    const knownIssues = query.locale
      ? await this.knownIssuesService.findByVehicleModelIdAndLocale(
          id,
          query.locale,
        )
      : await this.knownIssuesService.findByVehicleModelId(id);

    return new AdminVehicleModelDetailResponseDto(vehicleModel, knownIssues);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vehicle model' })
  @ApiOkResponse({ type: AdminVehicleModelResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Body() dto: AdminCreateVehicleModelDto,
  ): Promise<AdminVehicleModelResponseDto> {
    const vehicleModel = await this.vehicleModelsService.create(dto);
    return new AdminVehicleModelResponseDto(vehicleModel);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle model' })
  @ApiOkResponse({ type: AdminVehicleModelResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Vehicle model not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateVehicleModelDto,
  ): Promise<AdminVehicleModelResponseDto> {
    const vehicleModel = await this.vehicleModelsService.update(id, dto);
    return new AdminVehicleModelResponseDto(vehicleModel);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a vehicle model' })
  @ApiNoContentResponse({ description: 'Vehicle model removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Vehicle model not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.vehicleModelsService.softDelete(id);
  }
}
