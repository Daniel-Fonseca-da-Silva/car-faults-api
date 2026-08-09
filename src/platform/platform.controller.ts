import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { PlatformFaultsQueryDto } from './dto/platform-faults-query.dto';
import { PlatformFaultsResponseDto } from './dto/platform-faults-response.dto';
import { PlatformStatsResponseDto } from './dto/platform-stats-response.dto';
import { PlatformVehicleItemDto } from './dto/platform-vehicle-item.dto';
import { PlatformVehiclesQueryDto } from './dto/platform-vehicles-query.dto';
import { PlatformVehiclesResponseDto } from './dto/platform-vehicles-response.dto';
import { TopFaultItemDto } from './dto/top-fault-item.dto';
import {
  FAULTS_DEFAULT_LIMIT,
  FAULTS_DEFAULT_PAGE,
  VEHICLES_DEFAULT_LIMIT,
  VEHICLES_DEFAULT_PAGE,
} from './platform.constants';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get public platform-wide stats' })
  @ApiOkResponse({ type: PlatformStatsResponseDto })
  async getStats(): Promise<PlatformStatsResponseDto> {
    const stats = await this.platformService.getStats();
    return new PlatformStatsResponseDto(stats);
  }

  @Get('faults')
  @ApiOperation({
    summary: 'Get known issues filtered and paginated by report count',
  })
  @ApiOkResponse({ type: PlatformFaultsResponseDto })
  async getFaults(
    @Query() query: PlatformFaultsQueryDto,
  ): Promise<PlatformFaultsResponseDto> {
    const locale = query.locale ?? LookupLocale.EnGb;
    const page = query.page ?? FAULTS_DEFAULT_PAGE;
    const limit = query.limit ?? FAULTS_DEFAULT_LIMIT;
    const { items, total } = await this.platformService.getFaults({
      locale,
      page,
      limit,
      brand: query.brand,
      model: query.model,
      year: query.year,
      engine: query.engine,
      fuelType: query.fuelType,
      doors: query.doors,
    });
    return new PlatformFaultsResponseDto(
      items.map((row) => new TopFaultItemDto(row)),
      total,
      page,
      limit,
    );
  }

  @Get('vehicles')
  @ApiOperation({
    summary: 'Get the paginated vehicle model catalog, for sitemap generation',
    description:
      'Only returns vehicle models with a fuel type on record, since those are the only ones with a canonical URL.',
  })
  @ApiOkResponse({ type: PlatformVehiclesResponseDto })
  async getVehicles(
    @Query() query: PlatformVehiclesQueryDto,
  ): Promise<PlatformVehiclesResponseDto> {
    const page = query.page ?? VEHICLES_DEFAULT_PAGE;
    const limit = query.limit ?? VEHICLES_DEFAULT_LIMIT;
    const { items, total } = await this.platformService.getVehicles({
      page,
      limit,
    });
    return new PlatformVehiclesResponseDto(
      items.map((item) => new PlatformVehicleItemDto(item)),
      total,
      page,
      limit,
    );
  }
}
