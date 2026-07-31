import {
  Controller,
  Get,
  Headers,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  lookupsThrottlerOptions,
  THROTTLER_DEFAULT_NAME,
} from '../common/throttler/throttler-options.factory';
import { User } from '../users/entities/user.entity';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupsService } from './lookups.service';

const TURNSTILE_TOKEN_HEADER = 'x-turnstile-token';

@ApiTags('lookups')
@Controller('lookups')
@Throttle({ [THROTTLER_DEFAULT_NAME]: lookupsThrottlerOptions })
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
    description:
      'A Turnstile token is only required when the lookup is not already cached or persisted (i.e. it would trigger AI generation).',
  })
  @ApiHeader({
    name: TURNSTILE_TOKEN_HEADER,
    required: false,
    description:
      'Cloudflare Turnstile token, required for the AI-generation path',
  })
  @ApiOkResponse({ type: LookupResponseDto })
  @ApiForbiddenResponse({
    description:
      'Missing or invalid Turnstile token for the AI-generation path',
  })
  async lookup(
    @Req() req: Request,
    @Query() query: LookupQueryDto,
    @Headers(TURNSTILE_TOKEN_HEADER) turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    const result = await this.lookupsService.lookup(query, turnstileToken);

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
