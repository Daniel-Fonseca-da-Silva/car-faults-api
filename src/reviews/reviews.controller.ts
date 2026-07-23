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
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews for a known issue' })
  @ApiOkResponse({ type: [ReviewResponseDto] })
  async findAll(
    @Query() query: ListReviewsQueryDto,
  ): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsService.findByKnownIssue(
      query.knownIssueId,
    );
    return reviews.map((review) => new ReviewResponseDto(review));
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a known issue' })
  @ApiBody({ type: CreateReviewDto })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Known issue not found' })
  @ApiConflictResponse({ description: 'Known issue already reviewed' })
  async create(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const user = req.user as User;
    const review = await this.reviewsService.create(user.id, createReviewDto);
    return new ReviewResponseDto(review);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update the authenticated user's review" })
  @ApiBody({ type: UpdateReviewDto })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const user = req.user as User;
    const review = await this.reviewsService.update(
      id,
      user.id,
      updateReviewDto,
    );
    return new ReviewResponseDto(review);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the authenticated user's review" })
  @ApiNoContentResponse({ description: 'Review removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const user = req.user as User;
    await this.reviewsService.remove(id, user.id);
  }
}
