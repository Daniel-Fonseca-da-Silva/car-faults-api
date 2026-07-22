import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const NAME_MAX_LENGTH = 120;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ana Silva', maxLength: NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/ana.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
