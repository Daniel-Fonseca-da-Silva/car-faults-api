import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { R2StorageService } from '../storage/r2-storage.service';
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
    softDelete: jest.Mock;
  };
  let knownIssuesService: { findById: jest.Mock };
  let r2StorageService: { deleteByPublicUrl: jest.Mock };

  const userId = 'user-1';

  const buildComment = (overrides: Partial<Comment> = {}) =>
    ({
      id: 'comment-1',
      userId,
      knownIssueId: 'ki-1',
      body: 'Had the same issue',
      imageUrl: null,
      ...overrides,
    }) as Comment;

  beforeEach(async () => {
    commentsRepository = {
      findByKnownIssueId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    knownIssuesService = { findById: jest.fn() };
    r2StorageService = {
      deleteByPublicUrl: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: commentsRepository },
        { provide: KnownIssuesService, useValue: knownIssuesService },
        { provide: R2StorageService, useValue: r2StorageService },
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
        imageUrl: null,
      });
      expect(result).toBe(created);
    });

    it('persists the imageUrl when provided', async () => {
      knownIssuesService.findById.mockResolvedValue({ id: 'ki-1' });
      const created = buildComment({
        imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
      });
      commentsRepository.create.mockReturnValue(created);
      commentsRepository.save.mockResolvedValue(created);

      await commentsService.create(userId, {
        knownIssueId: 'ki-1',
        body: 'Had the same issue',
        imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
      });

      expect(commentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
        }),
      );
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
      expect(r2StorageService.deleteByPublicUrl).not.toHaveBeenCalled();
    });

    it('leaves the image untouched when imageUrl is not provided', async () => {
      const comment = buildComment({
        imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
      });
      commentsRepository.findById.mockResolvedValue(comment);
      commentsRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await commentsService.update('comment-1', userId, {
        body: 'Updated',
      });

      expect(result.imageUrl).toBe(
        'https://cdn.example.com/comments/user-1/uuid.jpg',
      );
      expect(r2StorageService.deleteByPublicUrl).not.toHaveBeenCalled();
    });

    it('deletes the old R2 object and sets the new imageUrl when it changes', async () => {
      const comment = buildComment({
        imageUrl: 'https://cdn.example.com/comments/user-1/old.jpg',
      });
      commentsRepository.findById.mockResolvedValue(comment);
      commentsRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await commentsService.update('comment-1', userId, {
        body: 'Updated',
        imageUrl: 'https://cdn.example.com/comments/user-1/new.jpg',
      });

      expect(r2StorageService.deleteByPublicUrl).toHaveBeenCalledWith(
        'https://cdn.example.com/comments/user-1/old.jpg',
      );
      expect(result.imageUrl).toBe(
        'https://cdn.example.com/comments/user-1/new.jpg',
      );
    });

    it('deletes the old R2 object and clears imageUrl when set to null', async () => {
      const comment = buildComment({
        imageUrl: 'https://cdn.example.com/comments/user-1/old.jpg',
      });
      commentsRepository.findById.mockResolvedValue(comment);
      commentsRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await commentsService.update('comment-1', userId, {
        body: 'Updated',
        imageUrl: null,
      });

      expect(r2StorageService.deleteByPublicUrl).toHaveBeenCalledWith(
        'https://cdn.example.com/comments/user-1/old.jpg',
      );
      expect(result.imageUrl).toBeNull();
    });

    it('propagates the error and does not save when the R2 delete fails', async () => {
      const comment = buildComment({
        imageUrl: 'https://cdn.example.com/comments/user-1/old.jpg',
      });
      commentsRepository.findById.mockResolvedValue(comment);
      r2StorageService.deleteByPublicUrl.mockRejectedValue(
        new Error('r2 down'),
      );

      await expect(
        commentsService.update('comment-1', userId, {
          body: 'Updated',
          imageUrl: 'https://cdn.example.com/comments/user-1/new.jpg',
        }),
      ).rejects.toThrow('r2 down');
      expect(commentsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the comment when owned by the user and has no image', async () => {
      commentsRepository.findById.mockResolvedValue(buildComment());

      await commentsService.remove('comment-1', userId);

      expect(r2StorageService.deleteByPublicUrl).not.toHaveBeenCalled();
      expect(commentsRepository.softDelete).toHaveBeenCalledWith('comment-1');
    });

    it('deletes the R2 image before soft-deleting the comment', async () => {
      commentsRepository.findById.mockResolvedValue(
        buildComment({
          imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
        }),
      );

      await commentsService.remove('comment-1', userId);

      expect(r2StorageService.deleteByPublicUrl).toHaveBeenCalledWith(
        'https://cdn.example.com/comments/user-1/uuid.jpg',
      );
      expect(commentsRepository.softDelete).toHaveBeenCalledWith('comment-1');
    });

    it('does not soft-delete the comment when the R2 delete fails', async () => {
      commentsRepository.findById.mockResolvedValue(
        buildComment({
          imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
        }),
      );
      r2StorageService.deleteByPublicUrl.mockRejectedValue(
        new Error('r2 down'),
      );

      await expect(commentsService.remove('comment-1', userId)).rejects.toThrow(
        'r2 down',
      );
      expect(commentsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the comment does not exist', async () => {
      commentsRepository.findById.mockResolvedValue(null);

      await expect(commentsService.remove('comment-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the comment belongs to another user', async () => {
      commentsRepository.findById.mockResolvedValue(
        buildComment({ userId: 'other-user' }),
      );

      await expect(commentsService.remove('comment-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
