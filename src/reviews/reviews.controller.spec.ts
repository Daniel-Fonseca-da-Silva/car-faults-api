import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let reviewsController: ReviewsController;
  let reviewsService: {
    findByKnownIssue: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const review = {
    id: 'review-1',
    userId: 'user-1',
    knownIssueId: 'ki-1',
    rating: 4,
    comment: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Review;

  beforeEach(async () => {
    reviewsService = {
      findByKnownIssue: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: reviewsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    reviewsController = module.get(ReviewsController);
  });

  it('should be defined', () => {
    expect(reviewsController).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the serialized reviews for a known issue', async () => {
      reviewsService.findByKnownIssue.mockResolvedValue([review]);
      const query: ListReviewsQueryDto = { knownIssueId: 'ki-1' };

      const result = await reviewsController.findAll(query);

      expect(reviewsService.findByKnownIssue).toHaveBeenCalledWith('ki-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'review-1', rating: 4 });
    });
  });

  describe('create', () => {
    it('creates a review for the authenticated user', async () => {
      const dto: CreateReviewDto = { knownIssueId: 'ki-1', rating: 4 };
      reviewsService.create.mockResolvedValue(review);

      const result = await reviewsController.create(req, dto);

      expect(reviewsService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({ id: 'review-1' });
    });
  });

  describe('update', () => {
    it("updates the authenticated user's review", async () => {
      const dto: UpdateReviewDto = { rating: 5 };
      const updated = { ...review, rating: 5 };
      reviewsService.update.mockResolvedValue(updated);

      const result = await reviewsController.update(req, 'review-1', dto);

      expect(reviewsService.update).toHaveBeenCalledWith(
        'review-1',
        'user-1',
        dto,
      );
      expect(result).toMatchObject({ id: 'review-1', rating: 5 });
    });
  });

  describe('remove', () => {
    it("removes the authenticated user's review", async () => {
      reviewsService.remove.mockResolvedValue(undefined);

      await reviewsController.remove(req, 'review-1');

      expect(reviewsService.remove).toHaveBeenCalledWith('review-1', 'user-1');
    });
  });
});
