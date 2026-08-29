import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Opaque cursor from a previous page’s nextCursor.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Page size. A resource-specific default and maximum apply.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export function resolveLimit(
  limit: number | undefined,
  bounds: { default: number; max: number },
): number {
  if (limit === undefined) {
    return bounds.default;
  }
  return Math.min(limit, bounds.max);
}
