import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Fix } from '../../fixes/entities/fix.entity';
import { FixSource } from '../../fixes/enums/fix-source.enum';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';

export class FixResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

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

  constructor(fix: Fix) {
    this.id = fix.id;
    this.summary = fix.summary;
    this.steps = fix.steps;
    this.estimatedCostEur = fix.estimatedCostEur;
    this.source = fix.source;
  }
}

export class KnownIssueResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Problematic gearbox' })
  title: string;

  @ApiProperty({ example: 'Synchros wear out prematurely under normal use.' })
  description: string;

  @ApiProperty({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  severity: IssueSeverity;

  @ApiPropertyOptional({ example: 120000, nullable: true })
  typicalKm: number | null;

  @ApiPropertyOptional({ example: ['https://example.com'], nullable: true })
  sources: string[] | null;

  @ApiProperty({ type: [FixResponseDto] })
  fixes: FixResponseDto[];

  constructor(knownIssue: KnownIssue) {
    this.id = knownIssue.id;
    this.title = knownIssue.title;
    this.description = knownIssue.description;
    this.severity = knownIssue.severity;
    this.typicalKm = knownIssue.typicalKm;
    this.sources = knownIssue.sources;
    this.fixes = (knownIssue.fixes ?? []).map((fix) => new FixResponseDto(fix));
  }
}

export class VehicleResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Polo' })
  model: string;

  @ApiPropertyOptional({ example: 'Polo 6N1', nullable: true })
  name: string | null;

  @ApiProperty({ example: 1994 })
  yearFrom: number;

  @ApiPropertyOptional({ example: 1999, nullable: true })
  yearTo: number | null;

  @ApiProperty({ example: '1.0' })
  engine: string;

  @ApiPropertyOptional({ example: 3, nullable: true })
  doors: number | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/vehicles/polo.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiPropertyOptional({ example: { power_hp: 50 }, nullable: true })
  techSpecs: Record<string, unknown> | null;

  constructor(vehicleModel: VehicleModel) {
    this.id = vehicleModel.id;
    this.brand = vehicleModel.brand;
    this.model = vehicleModel.model;
    this.name = vehicleModel.name;
    this.yearFrom = vehicleModel.yearFrom;
    this.yearTo = vehicleModel.yearTo;
    this.engine = vehicleModel.engine;
    this.doors = vehicleModel.doors;
    this.imageUrl = vehicleModel.imageUrl;
    this.techSpecs = vehicleModel.techSpecs;
  }
}

export class LookupResponseDto {
  @ApiProperty({ type: VehicleResponseDto })
  vehicle: VehicleResponseDto;

  @ApiProperty({ type: [KnownIssueResponseDto] })
  knownIssues: KnownIssueResponseDto[];

  constructor(vehicleModel: VehicleModel, knownIssues: KnownIssue[]) {
    this.vehicle = new VehicleResponseDto(vehicleModel);
    this.knownIssues = knownIssues.map(
      (knownIssue) => new KnownIssueResponseDto(knownIssue),
    );
  }
}
