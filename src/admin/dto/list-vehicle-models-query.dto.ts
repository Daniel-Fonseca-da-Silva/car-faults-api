import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/pagination/cursor-query.dto';

export class AdminListVehicleModelsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  declare limit?: number;

  @ApiPropertyOptional({ example: 'Volkswagen' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Polo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description:
      'Filter by image presence: "true" only with image_url, "false" only without.',
    example: 'false',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  hasImage?: 'true' | 'false';
}
