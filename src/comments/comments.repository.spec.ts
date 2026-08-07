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
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
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
    it('delegates to repository.find with user relation ordered by createdAt DESC', async () => {
      const comments = [{ id: 'comment-1' }] as Comment[];
      repository.find.mockResolvedValue(comments);

      const result = await commentsRepository.findByKnownIssueId('ki-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { knownIssueId: 'ki-1' },
        relations: { user: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(comments);
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
