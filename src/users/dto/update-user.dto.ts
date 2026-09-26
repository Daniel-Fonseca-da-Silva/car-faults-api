import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const NAME_MAX_LENGTH = 120;
const AVATAR_URL_MAX_LENGTH = 2048;

// avatarUrl is rendered to other users (comments, reviews), so an arbitrary
// host would let a user plant a tracking pixel that logs viewers' IPs. Only
// Google profile photo hosts (the source of every avatar today) are accepted.
export const AVATAR_URL_ALLOWED_HOSTS: (string | RegExp)[] = [
  /^[a-z0-9-]+\.googleusercontent\.com$/,
];

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ana Silva', maxLength: NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/avatar-id',
    description: 'HTTPS URL on a Google profile photo host (*.googleusercontent.com)',
    maxLength: AVATAR_URL_MAX_LENGTH,
  })
  @IsOptional()
  @MaxLength(AVATAR_URL_MAX_LENGTH)
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    host_whitelist: AVATAR_URL_ALLOWED_HOSTS,
  })
  avatarUrl?: string;
}
