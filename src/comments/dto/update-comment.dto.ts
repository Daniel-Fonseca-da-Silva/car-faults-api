import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Had the same issue at 90k km.' })
  @IsString()
  @MinLength(1)
  body: string;
}
