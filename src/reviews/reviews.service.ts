import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { Review } from './entities/review.entity';
import { ReviewsRepository } from './reviews.repository';

export interface CreateReviewData {
  knownIssueId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly knownIssuesService: KnownIssuesService,
  ) {}

  findByKnownIssue(knownIssueId: string): Promise<Review[]> {
    return this.reviewsRepository.findByKnownIssueId(knownIssueId);
  }

  async create(userId: string, data: CreateReviewData): Promise<Review> {
    const knownIssue = await this.knownIssuesService.findById(
      data.knownIssueId,
    );
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${data.knownIssueId} not found`);
    }

    const existing = await this.reviewsRepository.findByUserAndKnownIssue(
      userId,
      data.knownIssueId,
    );
    if (existing) {
      throw new ConflictException('You have already reviewed this known issue');
    }

    const review = this.reviewsRepository.create({
      userId,
      knownIssueId: data.knownIssueId,
      rating: data.rating,
      comment: data.comment ?? null,
    });
    return this.reviewsRepository.save(review);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateReviewData,
  ): Promise<Review> {
    const review = await this.getOwned(id, userId);

    if (data.rating !== undefined) {
      review.rating = data.rating;
    }
    if (data.comment !== undefined) {
      review.comment = data.comment;
    }

    return this.reviewsRepository.save(review);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getOwned(id, userId);
    await this.reviewsRepository.delete(id);
  }

  private async getOwned(id: string, userId: string): Promise<Review> {
    const review = await this.reviewsRepository.findById(id);
    if (!review || review.userId !== userId) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }
}
