import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'ana@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Ana Silva' })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/ana.jpg',
    nullable: true,
  })
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.avatarUrl = user.avatarUrl;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
