import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  findByKnownIssueId(knownIssueId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { knownIssueId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({ where: { id } });
  }

  create(data: Partial<Comment>): Comment {
    return this.repository.create(data);
  }

  save(comment: Comment): Promise<Comment> {
    return this.repository.save(comment);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
