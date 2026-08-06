import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { PlatformStatsResponseDto } from './dto/platform-stats-response.dto';
import { TopFaultsResponseDto } from './dto/top-fault-response.dto';
import {
  TOP_FAULTS_DEFAULT_LIMIT,
  TopFaultsQueryDto,
} from './dto/top-faults-query.dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide activity stats' })
  @ApiOkResponse({ type: PlatformStatsResponseDto })
  async getStats(): Promise<PlatformStatsResponseDto> {
    const stats = await this.platformService.getStats();
    return new PlatformStatsResponseDto(stats);
  }

  @Get('top-faults')
  @ApiOperation({ summary: 'Get the most-reported known issues' })
  @ApiOkResponse({ type: TopFaultsResponseDto })
  async getTopFaults(
    @Query() query: TopFaultsQueryDto,
  ): Promise<TopFaultsResponseDto> {
    const locale = query.locale ?? LookupLocale.EnGb;
    const limit = query.limit ?? TOP_FAULTS_DEFAULT_LIMIT;
    const topFaults = await this.platformService.getTopFaults(locale, limit);
    return new TopFaultsResponseDto(topFaults);
  }
}
