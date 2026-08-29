import { ApiProperty } from '@nestjs/swagger';
import { CursorPageDto } from '../../common/pagination/cursor-page.dto';
import { FavoriteVehicleResponseDto } from './favorite-vehicle-response.dto';

export class FavoritesPageDto extends CursorPageDto<FavoriteVehicleResponseDto> {
  @ApiProperty({ type: [FavoriteVehicleResponseDto] })
  declare items: FavoriteVehicleResponseDto[];

  @ApiProperty({
    description:
      'Opaque cursor for the next page; null when there is no next page.',
    nullable: true,
    example: null,
  })
  declare nextCursor: string | null;

  constructor(items: FavoriteVehicleResponseDto[], nextCursor: string | null) {
    super(items, nextCursor);
  }
}
