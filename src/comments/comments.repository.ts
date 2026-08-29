import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { Comment } from './entities/comment.entity';

export interface CommentCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  findByKnownIssueId(
    knownIssueId: string,
    limit: number,
    cursor?: CommentCursor,
  ): Promise<Comment[]> {
    const qb = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.known_issue_id = :knownIssueId', { knownIssueId })
      .orderBy('comment.created_at', 'DESC')
      .addOrderBy('comment.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          { expr: 'comment.created_at', direction: 'DESC', param: 'createdAt' },
          { expr: 'comment.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getMany();
  }

  findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({ where: { id } });
  }

  countAll(): Promise<number> {
    return this.repository.count();
  }

  create(data: Partial<Comment>): Comment {
    return this.repository.create(data);
  }

  save(comment: Comment): Promise<Comment> {
    return this.repository.save(comment);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
