import { Injectable, NotFoundException } from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import { resolveLimit } from '../common/pagination/cursor-query.dto';
import { splitPage } from '../common/pagination/paginate.util';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { CommentCursor, CommentsRepository } from './comments.repository';
import { Comment } from './entities/comment.entity';

export const COMMENTS_DEFAULT_LIMIT = 20;
export const COMMENTS_MAX_LIMIT = 100;

export interface CreateCommentData {
  knownIssueId: string;
  body: string;
  imageUrl?: string | null;
}

export interface UpdateCommentData {
  body: string;
  imageUrl?: string | null;
}

export interface CommentsPage {
  items: Comment[];
  nextCursor: string | null;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly knownIssuesService: KnownIssuesService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async findByKnownIssue(
    knownIssueId: string,
    query: { cursor?: string; limit?: number },
  ): Promise<CommentsPage> {
    const limit = resolveLimit(query.limit, {
      default: COMMENTS_DEFAULT_LIMIT,
      max: COMMENTS_MAX_LIMIT,
    });
    const cursor = query.cursor
      ? decodeCursor<CommentCursor>(query.cursor)
      : undefined;

    const rows = await this.commentsRepository.findByKnownIssueId(
      knownIssueId,
      limit,
      cursor,
    );
    const { items, hasMore } = splitPage(rows, limit);

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null;

    return { items, nextCursor };
  }

  countAll(): Promise<number> {
    return this.commentsRepository.countAll();
  }

  findById(id: string): Promise<Comment | null> {
    return this.commentsRepository.findById(id);
  }

  async create(userId: string, data: CreateCommentData): Promise<Comment> {
    const knownIssue = await this.knownIssuesService.findById(
      data.knownIssueId,
    );
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${data.knownIssueId} not found`);
    }

    const comment = this.commentsRepository.create({
      userId,
      knownIssueId: data.knownIssueId,
      body: data.body,
      imageUrl: data.imageUrl ?? null,
    });
    return this.commentsRepository.save(comment);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCommentData,
  ): Promise<Comment> {
    const comment = await this.getOwned(id, userId);

    if (data.imageUrl !== undefined && data.imageUrl !== comment.imageUrl) {
      await this.r2StorageService.deleteByPublicUrl(comment.imageUrl);
      comment.imageUrl = data.imageUrl;
    }

    comment.body = data.body;
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.getOwned(id, userId);
    if (comment.imageUrl) {
      await this.r2StorageService.deleteByPublicUrl(comment.imageUrl);
    }
    await this.commentsRepository.softDelete(id);
  }

  async adminRemove(id: string): Promise<void> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    if (comment.imageUrl) {
      await this.r2StorageService.deleteByPublicUrl(comment.imageUrl);
    }
    await this.commentsRepository.softDelete(id);
  }

  private async getOwned(id: string, userId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment || comment.userId !== userId) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return comment;
  }
}
