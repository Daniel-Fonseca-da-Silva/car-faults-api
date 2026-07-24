import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFixDto {
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

  @ApiPropertyOptional({ example: 450, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCostEur?: number;
}
