import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let commentsRepository: {
    findByKnownIssueId: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let knownIssuesService: { findById: jest.Mock };

  const userId = 'user-1';

  const buildComment = (overrides: Partial<Comment> = {}) =>
    ({
      id: 'comment-1',
      userId,
      knownIssueId: 'ki-1',
      body: 'Had the same issue',
      ...overrides,
    }) as Comment;

  beforeEach(async () => {
    commentsRepository = {
      findByKnownIssueId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    knownIssuesService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: commentsRepository },
        { provide: KnownIssuesService, useValue: knownIssuesService },
      ],
    }).compile();

    commentsService = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(commentsService).toBeDefined();
  });

  describe('findByKnownIssue', () => {
    it('delegates to the repository', async () => {
      const comments = [buildComment()];
      commentsRepository.findByKnownIssueId.mockResolvedValue(comments);

      const result = await commentsService.findByKnownIssue('ki-1');

      expect(commentsRepository.findByKnownIssueId).toHaveBeenCalledWith(
        'ki-1',
      );
      expect(result).toBe(comments);
    });
  });

  describe('create', () => {
    it('creates a comment when the known issue exists', async () => {
      knownIssuesService.findById.mockResolvedValue({
        id: 'ki-1',
      });
      const created = buildComment();
      commentsRepository.create.mockReturnValue(created);
      commentsRepository.save.mockResolvedValue(created);

      const result = await commentsService.create(userId, {
        knownIssueId: 'ki-1',
        body: 'Had the same issue',
      });

      expect(knownIssuesService.findById).toHaveBeenCalledWith('ki-1');
      expect(commentsRepository.create).toHaveBeenCalledWith({
        userId,
        knownIssueId: 'ki-1',
        body: 'Had the same issue',
      });
      expect(result).toBe(created);
    });

    it('throws NotFoundException when the known issue does not exist', async () => {
      knownIssuesService.findById.mockResolvedValue(null);

      await expect(
        commentsService.create(userId, {
          knownIssueId: 'missing',
          body: 'Had the same issue',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(commentsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the comment does not exist', async () => {
      commentsRepository.findById.mockResolvedValue(null);

      await expect(
        commentsService.update('comment-1', userId, { body: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the comment belongs to another user', async () => {
      commentsRepository.findById.mockResolvedValue(
        buildComment({ userId: 'other-user' }),
      );

      await expect(
        commentsService.update('comment-1', userId, { body: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the body', async () => {
      const comment = buildComment();
      commentsRepository.findById.mockResolvedValue(comment);
      commentsRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await commentsService.update('comment-1', userId, {
        body: 'Updated',
      });

      expect(result.body).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('deletes the comment when owned by the user', async () => {
      commentsRepository.findById.mockResolvedValue(buildComment());

      await commentsService.remove('comment-1', userId);

      expect(commentsRepository.delete).toHaveBeenCalledWith('comment-1');
    });

    it('throws NotFoundException when the comment does not exist', async () => {
      commentsRepository.findById.mockResolvedValue(null);

      await expect(commentsService.remove('comment-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the comment belongs to another user', async () => {
      commentsRepository.findById.mockResolvedValue(
        buildComment({ userId: 'other-user' }),
      );

      await expect(commentsService.remove('comment-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
