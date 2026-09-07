import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { Review } from './entities/review.entity';

export interface ReviewCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
  ) {}

  findByKnownIssueId(
    knownIssueId: string,
    limit: number,
    cursor?: ReviewCursor,
  ): Promise<Review[]> {
    const qb = this.repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.knownIssueId = :knownIssueId', { knownIssueId })
      .orderBy('review.createdAt', 'DESC')
      .addOrderBy('review.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          { expr: 'review.createdAt', direction: 'DESC', param: 'createdAt' },
          { expr: 'review.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getMany();
  }

  findById(id: string): Promise<Review | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByUserAndKnownIssue(
    userId: string,
    knownIssueId: string,
    excludeId?: string,
  ): Promise<Review | null> {
    return this.repository.findOne({
      where: {
        userId,
        knownIssueId,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
  }

  create(data: Partial<Review>): Review {
    return this.repository.create(data);
  }

  save(review: Review): Promise<Review> {
    return this.repository.save(review);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
