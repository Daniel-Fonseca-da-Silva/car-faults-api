import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const MIN_RATING = 1;
const MAX_RATING = 5;

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: MIN_RATING, maximum: MAX_RATING })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_RATING)
  @Max(MAX_RATING)
  rating?: number;

  @ApiPropertyOptional({ example: 'Fixed it myself in a weekend.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
