import { Injectable, NotFoundException } from '@nestjs/common';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { CommentsRepository } from './comments.repository';
import { Comment } from './entities/comment.entity';

export interface CreateCommentData {
  knownIssueId: string;
  body: string;
}

export interface UpdateCommentData {
  body: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly knownIssuesService: KnownIssuesService,
  ) {}

  findByKnownIssue(knownIssueId: string): Promise<Comment[]> {
    return this.commentsRepository.findByKnownIssueId(knownIssueId);
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
    });
    return this.commentsRepository.save(comment);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCommentData,
  ): Promise<Comment> {
    const comment = await this.getOwned(id, userId);
    comment.body = data.body;
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getOwned(id, userId);
    await this.commentsRepository.delete(id);
  }

  private async getOwned(id: string, userId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findById(id);
    if (!comment || comment.userId !== userId) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return comment;
  }
}
