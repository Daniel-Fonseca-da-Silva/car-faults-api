import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { resolveLimit } from '../common/pagination/cursor-query.dto';
import { PlatformFaultsQueryDto } from './dto/platform-faults-query.dto';
import { PlatformFaultsResponseDto } from './dto/platform-faults-response.dto';
import { PlatformStatsResponseDto } from './dto/platform-stats-response.dto';
import { PlatformVehicleItemDto } from './dto/platform-vehicle-item.dto';
import { PlatformVehiclesQueryDto } from './dto/platform-vehicles-query.dto';
import { PlatformVehiclesResponseDto } from './dto/platform-vehicles-response.dto';
import { TopFaultItemDto } from './dto/top-fault-item.dto';
import {
  FAULTS_DEFAULT_LIMIT,
  FAULTS_MAX_LIMIT,
  VEHICLES_DEFAULT_LIMIT,
  VEHICLES_MAX_LIMIT,
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
    const limit = resolveLimit(query.limit, {
      default: FAULTS_DEFAULT_LIMIT,
      max: FAULTS_MAX_LIMIT,
    });
    const { items, nextCursor } = await this.platformService.getFaults({
      locale,
      limit,
      cursor: query.cursor,
      brand: query.brand,
      model: query.model,
      year: query.year,
      engine: query.engine,
      fuelType: query.fuelType,
      doors: query.doors,
    });
    return new PlatformFaultsResponseDto(
      items.map((row) => new TopFaultItemDto(row)),
      nextCursor,
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
    const limit = resolveLimit(query.limit, {
      default: VEHICLES_DEFAULT_LIMIT,
      max: VEHICLES_MAX_LIMIT,
    });
    const { items, nextCursor } = await this.platformService.getVehicles({
      limit,
      cursor: query.cursor,
    });
    return new PlatformVehiclesResponseDto(
      items.map((item) => new PlatformVehicleItemDto(item)),
      nextCursor,
    );
  }
}
