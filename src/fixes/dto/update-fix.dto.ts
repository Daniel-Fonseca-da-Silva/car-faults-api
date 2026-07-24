import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateFixDto {
  @ApiPropertyOptional({ example: 'Replace gearbox synchros' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  summary?: string;

  @ApiPropertyOptional({
    example: 'Remove gearbox, replace synchro rings, reassemble.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  steps?: string;

  @ApiPropertyOptional({ example: 450, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCostEur?: number;
}
