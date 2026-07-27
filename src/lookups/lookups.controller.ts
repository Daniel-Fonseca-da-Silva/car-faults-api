import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupsService } from './lookups.service';

@ApiTags('lookups')
@Controller('lookups')
export class LookupsController {
  constructor(
    private readonly lookupsService: LookupsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Look up known issues and tech specs for a vehicle',
  })
  @ApiOkResponse({ type: LookupResponseDto })
  async lookup(
    @Req() req: Request,
    @Query() query: LookupQueryDto,
  ): Promise<LookupResponseDto> {
    const result = await this.lookupsService.lookup(query);

    const user = req.user as User | null;
    if (user) {
      void this.activityLogService.recordSearch(
        user.id,
        this.buildSearchMetadata(query),
      );
    }

    return result;
  }

  private buildSearchMetadata(query: LookupQueryDto): Record<string, unknown> {
    return {
      brand: query.brand,
      model: query.model,
      year: query.year,
      engine: query.engine,
      fuelType: query.fuelType,
      ...(query.doors !== undefined ? { doors: query.doors } : {}),
    };
  }
}
