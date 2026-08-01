import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
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
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';
import {
  UserVehicleDetailResponseDto,
  UserVehicleResponseDto,
} from './dto/user-vehicle-response.dto';
import { UserVehiclesQueryDto } from './dto/user-vehicles-query.dto';
import { UserVehiclesService } from './user-vehicles.service';

@ApiTags('user-vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-vehicles')
export class UserVehiclesController {
  constructor(private readonly userVehiclesService: UserVehiclesService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's garage" })
  @ApiOkResponse({ type: [UserVehicleResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async findAll(
    @Req() req: Request,
    @Query() query: UserVehiclesQueryDto,
  ): Promise<UserVehicleResponseDto[]> {
    const user = req.user as User;
    const items = await this.userVehiclesService.findAllByUserWithIssueCounts(
      user.id,
      query.language,
    );
    return items.map(
      ({ userVehicle, knownIssuesCount }) =>
        new UserVehicleResponseDto(userVehicle, knownIssuesCount),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: "Get one vehicle from the authenticated user's garage",
  })
  @ApiOkResponse({ type: UserVehicleDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User vehicle not found' })
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
    @Query() query: UserVehiclesQueryDto,
  ): Promise<UserVehicleDetailResponseDto> {
    const user = req.user as User;
    const userVehicle = await this.userVehiclesService.findOneByUser(
      id,
      user.id,
    );
    const knownIssues = await this.userVehiclesService.findKnownIssues(
      userVehicle,
      query.language,
    );
    return new UserVehicleDetailResponseDto(userVehicle, knownIssues);
  }

  @Post()
  @ApiOperation({
    summary: "Add a vehicle to the authenticated user's garage",
  })
  @ApiBody({ type: CreateUserVehicleDto })
  @ApiOkResponse({ type: UserVehicleResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Vehicle already in the garage' })
  async create(
    @Req() req: Request,
    @Body() createUserVehicleDto: CreateUserVehicleDto,
  ): Promise<UserVehicleResponseDto> {
    const user = req.user as User;
    const userVehicle = await this.userVehiclesService.create(
      user.id,
      createUserVehicleDto,
    );
    const knownIssuesCount =
      await this.userVehiclesService.countKnownIssues(userVehicle);
    return new UserVehicleResponseDto(userVehicle, knownIssuesCount);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Update a vehicle in the authenticated user's garage",
  })
  @ApiBody({ type: UpdateUserVehicleDto })
  @ApiOkResponse({ type: UserVehicleResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'User vehicle not found' })
  @ApiConflictResponse({ description: 'Vehicle already in the garage' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateUserVehicleDto: UpdateUserVehicleDto,
  ): Promise<UserVehicleResponseDto> {
    const user = req.user as User;
    const userVehicle = await this.userVehiclesService.update(
      id,
      user.id,
      updateUserVehicleDto,
    );
    const knownIssuesCount =
      await this.userVehiclesService.countKnownIssues(userVehicle);
    return new UserVehicleResponseDto(userVehicle, knownIssuesCount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Remove a vehicle from the authenticated user's garage",
  })
  @ApiNoContentResponse({ description: 'Vehicle removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User vehicle not found' })
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.userVehiclesService.remove(id, user.id);
  }
}
