import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_CODE_LENGTH = 128;

export class ExchangeSessionCodeDto {
  @ApiProperty({ example: 'xyz123...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_CODE_LENGTH)
  code: string;
}
