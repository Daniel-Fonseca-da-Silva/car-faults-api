import { Injectable, NotFoundException } from '@nestjs/common';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { CommentsRepository } from './comments.repository';
import { Comment } from './entities/comment.entity';

export interface CreateCommentData {
  knownIssueId: string;
  body: string;
  imageUrl?: string | null;
}

export interface UpdateCommentData {
  body: string;
  imageUrl?: string | null;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly knownIssuesService: KnownIssuesService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  findByKnownIssue(knownIssueId: string): Promise<Comment[]> {
    return this.commentsRepository.findByKnownIssueId(knownIssueId);
  }

  countAll(): Promise<number> {
    return this.commentsRepository.countAll();
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

  private async getOwned(id: string, userId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment || comment.userId !== userId) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return comment;
  }
}
