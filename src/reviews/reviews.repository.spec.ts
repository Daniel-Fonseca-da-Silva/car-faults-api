import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Not } from 'typeorm';
import { Review } from './entities/review.entity';
import { ReviewsRepository } from './reviews.repository';

describe('ReviewsRepository', () => {
  let reviewsRepository: ReviewsRepository;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsRepository,
        {
          provide: getRepositoryToken(Review),
          useValue: repository,
        },
      ],
    }).compile();

    reviewsRepository = module.get(ReviewsRepository);
  });

  it('should be defined', () => {
    expect(reviewsRepository).toBeDefined();
  });

  describe('findByKnownIssueId', () => {
    it('delegates to repository.find with user relation ordered by createdAt DESC', async () => {
      const reviews = [{ id: 'review-1' }] as Review[];
      repository.find.mockResolvedValue(reviews);

      const result = await reviewsRepository.findByKnownIssueId('ki-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { knownIssueId: 'ki-1' },
        relations: { user: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(reviews);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const review = { id: 'review-1' } as Review;
      repository.findOne.mockResolvedValue(review);

      const result = await reviewsRepository.findById('review-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(result).toBe(review);
    });
  });

  describe('findByUserAndKnownIssue', () => {
    it('queries by userId and knownIssueId', async () => {
      const review = { id: 'review-1' } as Review;
      repository.findOne.mockResolvedValue(review);

      const result = await reviewsRepository.findByUserAndKnownIssue(
        'user-1',
        'ki-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', knownIssueId: 'ki-1' },
      });
      expect(result).toBe(review);
    });

    it('excludes the given id when provided', async () => {
      repository.findOne.mockResolvedValue(null);

      await reviewsRepository.findByUserAndKnownIssue(
        'user-1',
        'ki-1',
        'review-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          knownIssueId: 'ki-1',
          id: Not('review-1'),
        },
      });
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { userId: 'user-1', knownIssueId: 'ki-1', rating: 4 };
      const created = { id: 'review-1', ...data } as Review;
      repository.create.mockReturnValue(created);

      const result = reviewsRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const review = { id: 'review-1' } as Review;
      repository.save.mockResolvedValue(review);

      const result = await reviewsRepository.save(review);

      expect(repository.save).toHaveBeenCalledWith(review);
      expect(result).toBe(review);
    });
  });

  describe('delete', () => {
    it('delegates to repository.delete', async () => {
      repository.delete.mockResolvedValue(undefined);

      await reviewsRepository.delete('review-1');

      expect(repository.delete).toHaveBeenCalledWith('review-1');
    });
  });
});
