import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import { resolveLimit } from '../common/pagination/cursor-query.dto';
import { splitPage } from '../common/pagination/paginate.util';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { Review } from './entities/review.entity';
import { ReviewCursor, ReviewsRepository } from './reviews.repository';

export const REVIEWS_DEFAULT_LIMIT = 20;
export const REVIEWS_MAX_LIMIT = 100;

export interface CreateReviewData {
  knownIssueId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

export interface ReviewsPage {
  items: Review[];
  nextCursor: string | null;
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly knownIssuesService: KnownIssuesService,
  ) {}

  async findByKnownIssue(
    knownIssueId: string,
    query: { cursor?: string; limit?: number },
  ): Promise<ReviewsPage> {
    const limit = resolveLimit(query.limit, {
      default: REVIEWS_DEFAULT_LIMIT,
      max: REVIEWS_MAX_LIMIT,
    });
    const cursor = query.cursor
      ? decodeCursor<ReviewCursor>(query.cursor)
      : undefined;

    const rows = await this.reviewsRepository.findByKnownIssueId(
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

    const deleted = await this.reviewsRepository.findDeletedByUserAndKnownIssue(
      userId,
      data.knownIssueId,
    );
    if (deleted) {
      const restored = await this.reviewsRepository.restore(deleted.id);
      restored.rating = data.rating;
      restored.comment = data.comment ?? null;
      return this.reviewsRepository.save(restored);
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
    await this.reviewsRepository.softDelete(id);
  }

  private async getOwned(id: string, userId: string): Promise<Review> {
    const review = await this.reviewsRepository.findById(id);
    if (!review || review.userId !== userId) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }
}
