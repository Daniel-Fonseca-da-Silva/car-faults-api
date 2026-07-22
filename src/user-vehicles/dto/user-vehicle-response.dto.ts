import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { KnownIssueResponseDto } from '../../lookups/dto/lookup-response.dto';
import { UserVehicle } from '../entities/user-vehicle.entity';

export class UserVehicleResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiPropertyOptional({
    example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    nullable: true,
  })
  vehicleModelId: string | null;

  @ApiProperty({ example: 'Volkswagen' })
  brand: string;

  @ApiProperty({ example: 'Polo' })
  model: string;

  @ApiProperty({ example: 2001 })
  year: number;

  @ApiProperty({ example: '1.0' })
  engine: string;

  @ApiPropertyOptional({ example: 'Meu Polo', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  doors: number | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  constructor(userVehicle: UserVehicle) {
    this.id = userVehicle.id;
    this.vehicleModelId = userVehicle.vehicleModelId;
    this.brand = userVehicle.brand;
    this.model = userVehicle.model;
    this.year = userVehicle.year;
    this.engine = userVehicle.engine;
    this.name = userVehicle.name;
    this.doors = userVehicle.doors;
    this.createdAt = userVehicle.createdAt;
    this.updatedAt = userVehicle.updatedAt;
  }
}

export class UserVehicleDetailResponseDto extends UserVehicleResponseDto {
  @ApiProperty({ type: [KnownIssueResponseDto] })
  knownIssues: KnownIssueResponseDto[];

  constructor(userVehicle: UserVehicle, knownIssues: KnownIssue[]) {
    super(userVehicle);
    this.knownIssues = knownIssues.map(
      (knownIssue) => new KnownIssueResponseDto(knownIssue),
    );
  }
}
