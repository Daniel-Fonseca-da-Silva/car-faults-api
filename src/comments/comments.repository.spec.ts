import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsRepository } from './comments.repository';

describe('CommentsRepository', () => {
  let commentsRepository: CommentsRepository;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
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
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsRepository,
        {
          provide: getRepositoryToken(Comment),
          useValue: repository,
        },
      ],
    }).compile();

    commentsRepository = module.get(CommentsRepository);
  });

  it('should be defined', () => {
    expect(commentsRepository).toBeDefined();
  });

  describe('findByKnownIssueId', () => {
    it('joins the user relation, filters by known issue and orders by created_at/id desc', async () => {
      const comments = [{ id: 'comment-1' }] as Comment[];
      queryBuilder.getMany.mockResolvedValue(comments);

      const result = await commentsRepository.findByKnownIssueId('ki-1', 20);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('comment');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'comment.user',
        'user',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'comment.known_issue_id = :knownIssueId',
        { knownIssueId: 'ki-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'comment.created_at',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'comment.id',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(21);
      expect(result).toBe(comments);
    });

    it('applies a keyset predicate when a cursor is given', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await commentsRepository.findByKnownIssueId('ki-1', 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'comment-0',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('comment.created_at'),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'comment-0',
        }),
      );
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const comment = { id: 'comment-1' } as Comment;
      repository.findOne.mockResolvedValue(comment);

      const result = await commentsRepository.findById('comment-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(result).toBe(comment);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { userId: 'user-1', knownIssueId: 'ki-1', body: 'Hi' };
      const created = { id: 'comment-1', ...data } as Comment;
      repository.create.mockReturnValue(created);

      const result = commentsRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const comment = { id: 'comment-1' } as Comment;
      repository.save.mockResolvedValue(comment);

      const result = await commentsRepository.save(comment);

      expect(repository.save).toHaveBeenCalledWith(comment);
      expect(result).toBe(comment);
    });
  });

  describe('softDelete', () => {
    it('delegates to repository.softDelete', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await commentsRepository.softDelete('comment-1');

      expect(repository.softDelete).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('countAll', () => {
    it('delegates to repository.count', async () => {
      repository.count.mockResolvedValue(42);

      const result = await commentsRepository.countAll();

      expect(repository.count).toHaveBeenCalledWith();
      expect(result).toBe(42);
    });
  });
});
