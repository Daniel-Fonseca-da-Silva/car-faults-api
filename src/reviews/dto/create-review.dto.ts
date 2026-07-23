import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const MIN_RATING = 1;
const MAX_RATING = 5;

export class CreateReviewDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;

  @ApiProperty({ example: 4, minimum: MIN_RATING, maximum: MAX_RATING })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_RATING)
  @Max(MAX_RATING)
  rating: number;

  @ApiPropertyOptional({ example: 'Fixed it myself in a weekend.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
