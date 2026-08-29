import { RawFavoriteRow } from '../activity-log.repository';
import { FavoriteVehicleResponseDto } from './favorite-vehicle-response.dto';

describe('FavoriteVehicleResponseDto', () => {
  const row: RawFavoriteRow = {
    id: 'log-1',
    vehicleModelId: 'vm-1',
    year: '2001',
    favoritedAt: new Date('2026-01-01'),
    brand: 'Volkswagen',
    model: 'Polo',
    engine: '1.0',
    fuelType: 'gasoline',
    doors: '3',
    imageUrl: 'https://cdn.example.com/vw-polo.webp',
  };

  it('maps and number-casts the raw hydrated row', () => {
    const dto = new FavoriteVehicleResponseDto(row);

    expect(dto).toMatchObject({
      id: 'log-1',
      vehicleModelId: 'vm-1',
      year: 2001,
      brand: 'Volkswagen',
      model: 'Polo',
      engine: '1.0',
      fuelType: 'gasoline',
      doors: 3,
      imageUrl: 'https://cdn.example.com/vw-polo.webp',
      favoritedAt: row.favoritedAt,
    });
  });

  it('maps fuelType and doors to null when absent', () => {
    const dto = new FavoriteVehicleResponseDto({
      ...row,
      fuelType: null,
      doors: null,
    });

    expect(dto.fuelType).toBeNull();
    expect(dto.doors).toBeNull();
  });
});
