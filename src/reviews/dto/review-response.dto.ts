import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';

export class ReviewResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  userId: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  knownIssueId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({
    example: 'Fixed it myself in a weekend.',
    nullable: true,
  })
  comment: string | null;

  @ApiPropertyOptional({ example: 'Jane Doe', nullable: true })
  userName: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/jane.jpg',
    nullable: true,
  })
  userAvatarUrl: string | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(review: Review) {
    this.id = review.id;
    this.userId = review.userId;
    this.knownIssueId = review.knownIssueId;
    this.rating = review.rating;
    this.comment = review.comment;
    this.userName = review.user?.name ?? null;
    this.userAvatarUrl = review.user?.avatarUrl ?? null;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
  }
}
