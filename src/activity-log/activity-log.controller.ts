import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogResponseDto } from './dto/activity-log-response.dto';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
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
          )
        : await this.activityLogService.recordDefectConsulted(
            user.id,
            createActivityLogDto.resourceId,
          );
    return new ActivityLogResponseDto(activityLog);
  }

  @Get('favorites/:vehicleModelId')
  @ApiOperation({
    summary:
      "Check whether a vehicle model is in the authenticated user's favorites",
  })
  @ApiOkResponse({ type: FavoriteStatusResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getFavoriteStatus(
    @Req() req: Request,
    @Param('vehicleModelId') vehicleModelId: string,
  ): Promise<FavoriteStatusResponseDto> {
    const user = req.user as User;
    const favorited = await this.activityLogService.isFavorited(
      user.id,
      vehicleModelId,
    );
    return new FavoriteStatusResponseDto(vehicleModelId, favorited);
  }

  @Delete('favorites/:vehicleModelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove a vehicle from the authenticated user's favorites",
  })
  @ApiNoContentResponse({ description: 'Favorite removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Favorite not found' })
  async removeFavorite(
    @Req() req: Request,
    @Param('vehicleModelId') vehicleModelId: string,
  ): Promise<void> {
    const user = req.user as User;
    await this.activityLogService.unfavoriteVehicle(user.id, vehicleModelId);
  }
}
