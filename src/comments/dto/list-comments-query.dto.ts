import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ListCommentsQueryDto {
  @ApiProperty({ example: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  knownIssueId: string;
}
