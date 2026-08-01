import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'JWT bearer access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  constructor(partial: Partial<AccessTokenResponseDto>) {
    Object.assign(this, partial);
  }
}
