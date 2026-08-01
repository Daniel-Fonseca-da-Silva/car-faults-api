import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { IsR2ImageUrl } from '../validators/is-r2-image-url.validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;

  @ApiProperty({ example: 'Had the same issue at 90k km.' })
  @IsString()
  @MinLength(1)
  body: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsR2ImageUrl()
  imageUrl?: string | null;
}
