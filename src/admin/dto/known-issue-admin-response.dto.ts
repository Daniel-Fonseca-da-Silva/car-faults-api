import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { AdminFixResponseDto } from './fix-admin-response.dto';

export class AdminKnownIssueResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  vehicleModelId: string;

  @ApiProperty({ example: 'Problematic gearbox' })
  title: string;

  @ApiProperty({ example: 'Synchros wear out prematurely under normal use.' })
  description: string;

  @ApiProperty({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  severity: IssueSeverity;

  @ApiProperty({ enum: LookupLocale, example: LookupLocale.EnGb })
  locale: LookupLocale;

  @ApiPropertyOptional({ example: 120000, nullable: true })
  typicalKm: number | null;

  @ApiPropertyOptional({ example: ['https://example.com'], nullable: true })
  sources: string[] | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  aiGeneratedAt: Date | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(knownIssue: KnownIssue) {
    this.id = knownIssue.id;
    this.vehicleModelId = knownIssue.vehicleModelId;
    this.title = knownIssue.title;
    this.description = knownIssue.description;
    this.severity = knownIssue.severity;
    this.locale = knownIssue.locale;
    this.typicalKm = knownIssue.typicalKm;
    this.sources = knownIssue.sources;
    this.aiGeneratedAt = knownIssue.aiGeneratedAt;
    this.createdAt = knownIssue.createdAt;
    this.updatedAt = knownIssue.updatedAt;
  }
}

export class AdminKnownIssueDetailResponseDto extends AdminKnownIssueResponseDto {
  @ApiProperty({ type: [AdminFixResponseDto] })
  fixes: AdminFixResponseDto[];

  constructor(knownIssue: KnownIssue) {
    super(knownIssue);
    this.fixes = (knownIssue.fixes ?? []).map(
      (fix) => new AdminFixResponseDto(fix),
    );
  }
}
