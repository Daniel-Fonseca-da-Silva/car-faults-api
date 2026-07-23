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
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for a known issue' })
  @ApiOkResponse({ type: [CommentResponseDto] })
  async findAll(
    @Query() query: ListCommentsQueryDto,
  ): Promise<CommentResponseDto[]> {
    const comments = await this.commentsService.findByKnownIssue(
      query.knownIssueId,
    );
    return comments.map((comment) => new CommentResponseDto(comment));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a comment on a known issue' })
  @ApiBody({ type: CreateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  async create(
    @Req() req: Request,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const user = req.user as User;
    const comment = await this.commentsService.create(
      user.id,
      createCommentDto,
    );
    return new CommentResponseDto(comment);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update the authenticated user's comment" })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const user = req.user as User;
    const comment = await this.commentsService.update(
      id,
      user.id,
      updateCommentDto,
    );
    return new CommentResponseDto(comment);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the authenticated user's comment" })
  @ApiNoContentResponse({ description: 'Comment removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.commentsService.remove(id, user.id);
  }
}
