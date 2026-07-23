import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
  ) {}

  findByKnownIssueId(knownIssueId: string): Promise<Review[]> {
    return this.repository.find({
      where: { knownIssueId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
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

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
