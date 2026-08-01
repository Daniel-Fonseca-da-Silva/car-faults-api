import { ApiProperty } from '@nestjs/swagger';

export class UploadCommentImageResponseDto {
  @ApiProperty({
    example: 'https://cdn.example.com/comments/b3a5c1d2/4e6f4a8b.jpg',
  })
  url: string;
}
