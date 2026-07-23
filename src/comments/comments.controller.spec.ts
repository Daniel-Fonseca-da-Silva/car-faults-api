import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

describe('CommentsController', () => {
  let commentsController: CommentsController;
  let commentsService: {
    findByKnownIssue: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const comment = {
    id: 'comment-1',
    userId: 'user-1',
    knownIssueId: 'ki-1',
    body: 'Had the same issue',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Comment;

  beforeEach(async () => {
    commentsService = {
      findByKnownIssue: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: commentsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    commentsController = module.get(CommentsController);
  });

  it('should be defined', () => {
    expect(commentsController).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the serialized comments for a known issue', async () => {
      commentsService.findByKnownIssue.mockResolvedValue([comment]);
      const query: ListCommentsQueryDto = { knownIssueId: 'ki-1' };

      const result = await commentsController.findAll(query);

      expect(commentsService.findByKnownIssue).toHaveBeenCalledWith('ki-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'comment-1' });
    });
  });

  describe('create', () => {
    it('creates a comment for the authenticated user', async () => {
      const dto: CreateCommentDto = {
        knownIssueId: 'ki-1',
        body: 'Had the same issue',
      };
      commentsService.create.mockResolvedValue(comment);

      const result = await commentsController.create(req, dto);

      expect(commentsService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({ id: 'comment-1' });
    });
  });

  describe('update', () => {
    it("updates the authenticated user's comment", async () => {
      const dto: UpdateCommentDto = { body: 'Updated' };
      const updated = { ...comment, body: 'Updated' };
      commentsService.update.mockResolvedValue(updated);

      const result = await commentsController.update(req, 'comment-1', dto);

      expect(commentsService.update).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
        dto,
      );
      expect(result).toMatchObject({ id: 'comment-1', body: 'Updated' });
    });
  });

  describe('remove', () => {
    it("removes the authenticated user's comment", async () => {
      commentsService.remove.mockResolvedValue(undefined);

      await commentsController.remove(req, 'comment-1');

      expect(commentsService.remove).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
      );
    });
  });
});
