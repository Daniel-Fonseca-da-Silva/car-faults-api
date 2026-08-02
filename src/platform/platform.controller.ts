import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { PlatformStatsResponseDto } from './dto/platform-stats-response.dto';
import { TopFaultItemDto } from './dto/top-fault-item.dto';
import { TopFaultsQueryDto } from './dto/top-faults-query.dto';
import { TopFaultsResponseDto } from './dto/top-faults-response.dto';
import { TOP_FAULTS_DEFAULT_LIMIT } from './platform.constants';
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

  @Get('top-faults')
  @ApiOperation({ summary: 'Get the most reported known issues' })
  @ApiOkResponse({ type: TopFaultsResponseDto })
  async getTopFaults(
    @Query() query: TopFaultsQueryDto,
  ): Promise<TopFaultsResponseDto> {
    const locale = query.locale ?? LookupLocale.EnGb;
    const limit = query.limit ?? TOP_FAULTS_DEFAULT_LIMIT;
    const rows = await this.platformService.getTopFaults(locale, limit);
    return new TopFaultsResponseDto(
      rows.map((row) => new TopFaultItemDto(row)),
    );
  }
}
