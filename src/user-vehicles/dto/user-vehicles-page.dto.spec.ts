import { UserVehicleResponseDto } from './user-vehicle-response.dto';
import { UserVehiclesPageDto } from './user-vehicles-page.dto';

describe('UserVehiclesPageDto', () => {
  it('exposes items and nextCursor', () => {
    const item = { id: 'uv-1' } as UserVehicleResponseDto;

    const dto = new UserVehiclesPageDto([item], 'next-cursor');

    expect(dto.items).toEqual([item]);
    expect(dto.nextCursor).toBe('next-cursor');
  });

  it('supports a null nextCursor for the last page', () => {
    const dto = new UserVehiclesPageDto([], null);

    expect(dto.nextCursor).toBeNull();
  });
});
