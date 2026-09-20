import { ApiProperty } from '@nestjs/swagger';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../../known-issues/known-issues.repository';
import { TopFaultVehicleDto } from './top-fault-vehicle.dto';

export class TopFaultItemDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Timing chain tensioner wear' })
  faultTitle: string;

  @ApiProperty({ enum: IssueSeverity, example: IssueSeverity.HIGH })
  severity: IssueSeverity;

  @ApiProperty({ example: 412 })
  reportCount: number;

  @ApiProperty({
    enum: LookupLocale,
    example: LookupLocale.PtPt,
    description:
      'Locale this fault is actually written in. May differ from the ' +
      'requested locale when no content exists yet for that locale and ' +
      'the API fell back to another one.',
  })
  contentLocale: LookupLocale;

  @ApiProperty({ type: TopFaultVehicleDto })
  vehicle: TopFaultVehicleDto;

  constructor(row: TopFaultRow) {
    this.id = row.id;
    this.faultTitle = row.title;
    this.severity = row.severity;
    this.reportCount = row.reportCount;
    this.contentLocale = row.contentLocale;
    this.vehicle = new TopFaultVehicleDto(row);
  }
}
