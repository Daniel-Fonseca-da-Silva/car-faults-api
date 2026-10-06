import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminUpdateFixDto {
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
}
