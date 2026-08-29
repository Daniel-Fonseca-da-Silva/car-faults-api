import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { Review } from './entities/review.entity';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let reviewsService: ReviewsService;
  let reviewsRepository: {
    findByKnownIssueId: jest.Mock;
    findById: jest.Mock;
    findByUserAndKnownIssue: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let knownIssuesService: { findById: jest.Mock };

  const userId = 'user-1';

  const buildReview = (overrides: Partial<Review> = {}) =>
    ({
      id: 'review-1',
      userId,
      knownIssueId: 'ki-1',
      rating: 4,
      comment: null,
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as Review;

  beforeEach(async () => {
    reviewsRepository = {
      findByKnownIssueId: jest.fn(),
      findById: jest.fn(),
      findByUserAndKnownIssue: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    knownIssuesService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: ReviewsRepository, useValue: reviewsRepository },
        { provide: KnownIssuesService, useValue: knownIssuesService },
      ],
    }).compile();

    reviewsService = module.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(reviewsService).toBeDefined();
  });

  describe('findByKnownIssue', () => {
    it('resolves the default limit and returns a null nextCursor when there is no next page', async () => {
      const reviews = [buildReview()];
      reviewsRepository.findByKnownIssueId.mockResolvedValue(reviews);

      const result = await reviewsService.findByKnownIssue('ki-1', {});

      expect(reviewsRepository.findByKnownIssueId).toHaveBeenCalledWith(
        'ki-1',
        20,
        undefined,
      );
      expect(result.items).toBe(reviews);
      expect(result.nextCursor).toBeNull();
    });

    it('returns an encoded nextCursor when the repository reports a lookahead row', async () => {
      const first = buildReview({
        id: 'review-2',
        createdAt: new Date('2026-01-02'),
      });
      const second = buildReview({ id: 'review-1' });
      reviewsRepository.findByKnownIssueId.mockResolvedValue([first, second]);

      const result = await reviewsService.findByKnownIssue('ki-1', {
        limit: 1,
      });

      expect(reviewsRepository.findByKnownIssueId).toHaveBeenCalledWith(
        'ki-1',
        1,
        undefined,
      );
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).not.toBeNull();
    });

    it('decodes the given cursor and passes it to the repository', async () => {
      reviewsRepository.findByKnownIssueId.mockResolvedValue([]);
      const cursor = Buffer.from(
        JSON.stringify({
          createdAt: '2026-01-01T00:00:00.000Z',
          id: 'review-0',
        }),
        'utf8',
      ).toString('base64url');

      await reviewsService.findByKnownIssue('ki-1', { cursor });

      expect(reviewsRepository.findByKnownIssueId).toHaveBeenCalledWith(
        'ki-1',
        20,
        { createdAt: '2026-01-01T00:00:00.000Z', id: 'review-0' },
      );
    });
  });

  describe('create', () => {
    it('creates a review when the known issue exists and is not already reviewed', async () => {
      knownIssuesService.findById.mockResolvedValue({
        id: 'ki-1',
      });
      reviewsRepository.findByUserAndKnownIssue.mockResolvedValue(null);
      const created = buildReview();
      reviewsRepository.create.mockReturnValue(created);
      reviewsRepository.save.mockResolvedValue(created);

      const result = await reviewsService.create(userId, {
        knownIssueId: 'ki-1',
        rating: 4,
      });

      expect(knownIssuesService.findById).toHaveBeenCalledWith('ki-1');
      expect(reviewsRepository.findByUserAndKnownIssue).toHaveBeenCalledWith(
        userId,
        'ki-1',
      );
      expect(reviewsRepository.create).toHaveBeenCalledWith({
        userId,
        knownIssueId: 'ki-1',
        rating: 4,
        comment: null,
      });
      expect(result).toBe(created);
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesService.findById.mockResolvedValue(null);

      await expect(
        reviewsService.create(userId, { knownIssueId: 'missing', rating: 4 }),
      ).rejects.toThrow(NotFoundException);
      expect(reviewsRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user already reviewed the known issue', async () => {
      knownIssuesService.findById.mockResolvedValue({
        id: 'ki-1',
      });
      reviewsRepository.findByUserAndKnownIssue.mockResolvedValue(
        buildReview(),
      );

      await expect(
        reviewsService.create(userId, { knownIssueId: 'ki-1', rating: 4 }),
      ).rejects.toThrow(ConflictException);
      expect(reviewsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the review does not exist', async () => {
      reviewsRepository.findById.mockResolvedValue(null);

      await expect(
        reviewsService.update('review-1', userId, { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the review belongs to another user', async () => {
      reviewsRepository.findById.mockResolvedValue(
        buildReview({ userId: 'other-user' }),
      );

      await expect(
        reviewsService.update('review-1', userId, { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates rating and comment', async () => {
      const review = buildReview();
      reviewsRepository.findById.mockResolvedValue(review);
      reviewsRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await reviewsService.update('review-1', userId, {
        rating: 5,
        comment: 'Updated',
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Updated');
    });

    it('leaves fields untouched when not provided', async () => {
      const review = buildReview({ rating: 3, comment: 'Original' });
      reviewsRepository.findById.mockResolvedValue(review);
      reviewsRepository.save.mockImplementation((r) => Promise.resolve(r));

      const result = await reviewsService.update('review-1', userId, {});

      expect(result.rating).toBe(3);
      expect(result.comment).toBe('Original');
    });
  });

  describe('remove', () => {
    it('deletes the review when owned by the user', async () => {
      reviewsRepository.findById.mockResolvedValue(buildReview());

      await reviewsService.remove('review-1', userId);

      expect(reviewsRepository.softDelete).toHaveBeenCalledWith('review-1');
    });

    it('throws NotFoundException when the review does not exist', async () => {
      reviewsRepository.findById.mockResolvedValue(null);

      await expect(reviewsService.remove('review-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(reviewsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the review belongs to another user', async () => {
      reviewsRepository.findById.mockResolvedValue(
        buildReview({ userId: 'other-user' }),
      );

      await expect(reviewsService.remove('review-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(reviewsRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
