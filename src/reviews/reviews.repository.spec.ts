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
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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
    it('joins the user relation, filters by known issue and orders by created_at/id desc', async () => {
      const reviews = [{ id: 'review-1' }] as Review[];
      queryBuilder.getMany.mockResolvedValue(reviews);

      const result = await reviewsRepository.findByKnownIssueId('ki-1', 20);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('review');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'review.user',
        'user',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'review.known_issue_id = :knownIssueId',
        { knownIssueId: 'ki-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'review.created_at',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('review.id', 'DESC');
      expect(queryBuilder.take).toHaveBeenCalledWith(21);
      expect(result).toBe(reviews);
    });

    it('applies a keyset predicate when a cursor is given', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await reviewsRepository.findByKnownIssueId('ki-1', 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'review-0',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('review.created_at'),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'review-0',
        }),
      );
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

  describe('softDelete', () => {
    it('delegates to repository.softDelete', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await reviewsRepository.softDelete('review-1');

      expect(repository.softDelete).toHaveBeenCalledWith('review-1');
    });
  });
});
