import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { KnownIssueWithCommentCount } from '../../known-issues/known-issues.repository';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';

class TopFaultVehicleDto {
  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Polo' })
  model: string;

  @ApiProperty({ example: 1994 })
  yearFrom: number;

  @ApiProperty({ example: '1.0' })
  engine: string;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.DIESEL,
    nullable: true,
  })
  fuelType: FuelType | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  doors: number | null;

  constructor(vehicleModel: VehicleModel) {
    this.brand = vehicleModel.brand;
    this.model = vehicleModel.model;
    this.yearFrom = vehicleModel.yearFrom;
    this.engine = vehicleModel.engine;
    this.fuelType = vehicleModel.fuelType;
    this.doors = vehicleModel.doors;
  }
}

export class TopFaultResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Problematic gearbox' })
  faultTitle: string;

  @ApiProperty({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  severity: IssueSeverity;

  @ApiProperty({ example: 5 })
  reportCount: number;

  @ApiProperty({ type: TopFaultVehicleDto })
  vehicle: TopFaultVehicleDto;

  constructor(knownIssue: KnownIssueWithCommentCount) {
    this.id = knownIssue.id;
    this.faultTitle = knownIssue.title;
    this.severity = knownIssue.severity;
    this.reportCount = knownIssue.commentCount;
    this.vehicle = new TopFaultVehicleDto(knownIssue.vehicleModel);
  }
}

export class TopFaultsResponseDto {
  @ApiProperty({ type: [TopFaultResponseDto] })
  items: TopFaultResponseDto[];

  constructor(knownIssues: KnownIssueWithCommentCount[]) {
    this.items = knownIssues.map(
      (knownIssue) => new TopFaultResponseDto(knownIssue),
    );
  }
}
