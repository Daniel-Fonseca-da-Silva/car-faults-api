import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { IsR2ImageUrl } from '../validators/is-r2-image-url.validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Had the same issue at 90k km.' })
  @IsString()
  @MinLength(1)
  body: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    nullable: true,
    description: 'Pass null to remove the existing image',
  })
  @IsOptional()
  @IsR2ImageUrl()
  imageUrl?: string | null;
}
