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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateFixDto } from './dto/create-fix.dto';
import { FixResponseDto } from './dto/fix-response.dto';
import { ListFixesQueryDto } from './dto/list-fixes-query.dto';
import { UpdateFixDto } from './dto/update-fix.dto';
import { VoteFixDto } from './dto/vote-fix.dto';
import { FixesService } from './fixes.service';

@ApiTags('fixes')
@Controller('fixes')
export class FixesController {
  constructor(private readonly fixesService: FixesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List community fixes for a known issue' })
  @ApiOkResponse({ type: [FixResponseDto] })
  async findAll(
    @Req() req: Request,
    @Query() query: ListFixesQueryDto,
  ): Promise<FixResponseDto[]> {
    const user = req.user as User | null;
    const fixes = await this.fixesService.findByKnownIssue(
      query.knownIssueId,
      user?.id,
    );
    return fixes.map((fix) => new FixResponseDto(fix));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Suggest a fix for a known issue' })
  @ApiBody({ type: CreateFixDto })
  @ApiOkResponse({ type: FixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async create(
    @Req() req: Request,
    @Body() createFixDto: CreateFixDto,
  ): Promise<FixResponseDto> {
    const user = req.user as User;
    const fix = await this.fixesService.create(user.id, createFixDto);
    return new FixResponseDto(fix);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update the authenticated user's fix" })
  @ApiBody({ type: UpdateFixDto })
  @ApiOkResponse({ type: FixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateFixDto: UpdateFixDto,
  ): Promise<FixResponseDto> {
    const user = req.user as User;
    const fix = await this.fixesService.update(id, user.id, updateFixDto);
    return new FixResponseDto(fix);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the authenticated user's fix" })
  @ApiNoContentResponse({ description: 'Fix removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.fixesService.remove(id, user.id);
  }

  @Post(':id/vote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like or dislike a fix' })
  @ApiBody({ type: VoteFixDto })
  @ApiOkResponse({ type: FixResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiForbiddenResponse({
    description: 'Authors cannot vote on their own fix',
  })
  @ApiNotFoundResponse({ description: 'Fix not found' })
  async vote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() voteFixDto: VoteFixDto,
  ): Promise<FixResponseDto> {
    const user = req.user as User;
    const fix = await this.fixesService.vote(id, user.id, voteFixDto.value);
    return new FixResponseDto(fix);
  }

  @Delete(':id/vote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove the authenticated user's vote" })
  @ApiNoContentResponse({ description: 'Vote removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Vote not found' })
  async removeVote(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const user = req.user as User;
    await this.fixesService.removeVote(id, user.id);
  }
}
