import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FixVoteValue } from '../enums/fix-vote-value.enum';

export class VoteFixDto {
  @ApiProperty({ enum: FixVoteValue, example: FixVoteValue.LIKE })
  @IsEnum(FixVoteValue)
  value: FixVoteValue;
}
