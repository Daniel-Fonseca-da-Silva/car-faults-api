import { FavoriteVehicleResponseDto } from './favorite-vehicle-response.dto';
import { FavoritesPageDto } from './favorites-page.dto';

describe('FavoritesPageDto', () => {
  it('exposes items and nextCursor', () => {
    const item = { id: 'log-1' } as FavoriteVehicleResponseDto;

    const dto = new FavoritesPageDto([item], 'next-cursor');

    expect(dto.items).toEqual([item]);
    expect(dto.nextCursor).toBe('next-cursor');
  });

  it('supports a null nextCursor for the last page', () => {
    const dto = new FavoritesPageDto([], null);

    expect(dto.nextCursor).toBeNull();
  });
});
