import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { UserVehicleResponseDto } from './user-vehicle-response.dto';

export class UserVehiclesPageDto extends CursorPageDto<UserVehicleResponseDto> {
  @ApiProperty({ type: [UserVehicleResponseDto] })
  declare items: UserVehicleResponseDto[];

  @ApiProperty({ nullable: true, example: null })
  declare nextCursor: string | null;

  constructor(items: UserVehicleResponseDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
