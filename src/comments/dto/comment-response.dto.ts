import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comment } from '../entities/comment.entity';

export class CommentResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  userId: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  knownIssueId: string;

  @ApiProperty({ example: 'Had the same issue at 90k km.' })
  body: string;

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

  constructor(comment: Comment) {
    this.id = comment.id;
    this.userId = comment.userId;
    this.knownIssueId = comment.knownIssueId;
    this.body = comment.body;
    this.userName = comment.user?.name ?? null;
    this.userAvatarUrl = comment.user?.avatarUrl ?? null;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
  }
}
