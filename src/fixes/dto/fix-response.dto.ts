import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FixSource } from '../enums/fix-source.enum';
import { FixVoteValue } from '../enums/fix-vote-value.enum';
import { FixWithCounts } from '../fixes.repository';

export class FixResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  knownIssueId: string;

  @ApiPropertyOptional({
    example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({ example: 'Replace gearbox synchros' })
  summary: string;

  @ApiProperty({
    example: 'Remove gearbox, replace synchro rings, reassemble.',
  })
  steps: string;

  @ApiPropertyOptional({ example: '450.00', nullable: true })
  estimatedCostEur: string | null;

  @ApiProperty({ enum: FixSource, example: FixSource.USER })
  source: FixSource;

  @ApiProperty({ example: 12 })
  likes: number;

  @ApiProperty({ example: 3 })
  dislikes: number;

  @ApiPropertyOptional({
    enum: FixVoteValue,
    example: FixVoteValue.LIKE,
    nullable: true,
  })
  myVote: FixVoteValue | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(fix: FixWithCounts) {
    this.id = fix.id;
    this.knownIssueId = fix.knownIssueId;
    this.userId = fix.userId;
    this.summary = fix.summary;
    this.steps = fix.steps;
    this.estimatedCostEur = fix.estimatedCostEur;
    this.source = fix.source;
    this.likes = fix.likes;
    this.dislikes = fix.dislikes;
    this.myVote = fix.myVote;
    this.createdAt = fix.createdAt;
    this.updatedAt = fix.updatedAt;
  }
}
