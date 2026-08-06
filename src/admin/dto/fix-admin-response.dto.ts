import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Fix } from '../../fixes/entities/fix.entity';
import { FixSource } from '../../fixes/enums/fix-source.enum';

export class AdminFixResponseDto {
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

  @ApiProperty({ enum: FixSource, example: FixSource.AI })
  source: FixSource;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(fix: Fix) {
    this.id = fix.id;
    this.knownIssueId = fix.knownIssueId;
    this.userId = fix.userId;
    this.summary = fix.summary;
    this.steps = fix.steps;
    this.estimatedCostEur = fix.estimatedCostEur;
    this.source = fix.source;
    this.createdAt = fix.createdAt;
    this.updatedAt = fix.updatedAt;
  }
}
