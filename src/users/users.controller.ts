import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserStatsResponseDto } from './dto/user-stats-response.dto';
import { User } from './entities/user.entity';
import { UserStatsService } from './user-stats.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  getProfile(@Req() req: Request): UserResponseDto {
    return new UserResponseDto(req.user as User);
  }

  @Get('me/stats')
  @ApiOperation({ summary: "Get the authenticated user's activity stats" })
  @ApiOkResponse({ type: UserStatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getMyStats(@Req() req: Request): Promise<UserStatsResponseDto> {
    const user = req.user as User;
    const stats = await this.userStatsService.getStats(user.id);
    return new UserStatsResponseDto(stats);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the authenticated user's profile" })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = req.user as User;
    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    return new UserResponseDto(updatedUser);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft delete the authenticated user's account" })
  @ApiNoContentResponse({ description: 'Account deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async deleteProfile(@Req() req: Request): Promise<void> {
    const user = req.user as User;
    await this.usersService.softDelete(user.id);
  }
}
