import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class AdminCreateFixDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;

  @ApiProperty({ example: 'Replace gearbox synchros' })
  @IsString()
  @MinLength(1)
  summary: string;

  @ApiProperty({
    example: 'Remove gearbox, replace synchro rings, reassemble.',
  })
  @IsString()
  @MinLength(1)
  steps: string;
}
