import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogResponseDto } from './dto/activity-log-response.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { FavoritesPageDto } from './dto/favorites-page.dto';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { FavoriteStatusResponseDto } from './dto/favorite-status-response.dto';
import { ActivityLogType } from './enums/activity-log-type.enum';

@ApiTags('activity-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a defect-consulted or vehicle-favorite activity',
  })
  @ApiBody({ type: CreateActivityLogDto })
  @ApiOkResponse({ type: ActivityLogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Req() req: Request,
    @Body() createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLogResponseDto> {
    const user = req.user as User;
    const activityLog =
      createActivityLogDto.type === ActivityLogType.VEHICLE_FAVORITE
        ? await this.activityLogService.favoriteVehicle(
            user.id,
            createActivityLogDto.resourceId,
            createActivityLogDto.year,
          )
        : await this.activityLogService.recordDefectConsulted(
            user.id,
            createActivityLogDto.resourceId,
          );
    return new ActivityLogResponseDto(activityLog);
  }

  // Declared above `GET favorites/:vehicleModelId` — Nest matches routes in
  // declaration order, and this static segment would otherwise be captured
  // by the `:vehicleModelId` param.
  @Get('favorites')
  @ApiOperation({
    summary: "List the authenticated user's favorited vehicles",
  })
  @ApiOkResponse({ type: FavoritesPageDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async findFavorites(
    @Req() req: Request,
    @Query() query: FavoritesQueryDto,
  ): Promise<FavoritesPageDto> {
    const user = req.user as User;
    const { items, nextCursor } = await this.activityLogService.findFavorites(
      user.id,
      query,
    );
    return new FavoritesPageDto(items, nextCursor);
  }

  @Get('favorites/:vehicleModelId')
  @ApiOperation({
    summary:
      "Check whether a vehicle model/year is in the authenticated user's favorites",
  })
  @ApiQuery({ name: 'year', type: Number, required: true })
  @ApiOkResponse({ type: FavoriteStatusResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getFavoriteStatus(
    @Req() req: Request,
    @Param('vehicleModelId') vehicleModelId: string,
    @Query('year') year: string,
  ): Promise<FavoriteStatusResponseDto> {
    const user = req.user as User;
    const favorited = await this.activityLogService.isFavorited(
      user.id,
      vehicleModelId,
      parseYear(year),
    );
    return new FavoriteStatusResponseDto(vehicleModelId, favorited);
  }

  @Delete('favorites/:vehicleModelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove a vehicle from the authenticated user's favorites",
  })
  @ApiQuery({ name: 'year', type: Number, required: true })
  @ApiNoContentResponse({ description: 'Favorite removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Favorite not found' })
  async removeFavorite(
    @Req() req: Request,
    @Param('vehicleModelId') vehicleModelId: string,
    @Query('year') year: string,
  ): Promise<void> {
    const user = req.user as User;
    await this.activityLogService.unfavoriteVehicle(
      user.id,
      vehicleModelId,
      parseYear(year),
    );
  }
}

function parseYear(rawYear: string): number {
  const year = Number(rawYear);
  if (!rawYear || !Number.isInteger(year)) {
    throw new BadRequestException('year must be an integer');
  }
  return year;
}
