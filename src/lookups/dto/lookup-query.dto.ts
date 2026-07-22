import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

const MIN_YEAR = 1900;

export class LookupQueryDto {
  @ApiProperty({ example: 'Volkswagen' })
  @IsString()
  @MinLength(1)
  brand: string;

  @ApiProperty({ example: 'Polo' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiProperty({ example: 2001 })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  year: number;

  @ApiProperty({ example: '1.0' })
  @IsString()
  @MinLength(1)
  engine: string;
}
