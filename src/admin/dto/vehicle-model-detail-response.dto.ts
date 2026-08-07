import { ApiProperty } from '@nestjs/swagger';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import { AdminKnownIssueResponseDto } from './known-issue-admin-response.dto';
import { AdminVehicleModelResponseDto } from './vehicle-model-admin-response.dto';

export class AdminVehicleModelDetailResponseDto {
  @ApiProperty({ type: AdminVehicleModelResponseDto })
  vehicle: AdminVehicleModelResponseDto;

  @ApiProperty({ type: [AdminKnownIssueResponseDto] })
  knownIssues: AdminKnownIssueResponseDto[];

  constructor(vehicleModel: VehicleModel, knownIssues: KnownIssue[]) {
    this.vehicle = new AdminVehicleModelResponseDto(vehicleModel);
    this.knownIssues = knownIssues.map(
      (knownIssue) => new AdminKnownIssueResponseDto(knownIssue),
    );
  }
}
