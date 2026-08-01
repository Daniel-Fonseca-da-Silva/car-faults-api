import { FavoriteStatusResponseDto } from './favorite-status-response.dto';

describe('FavoriteStatusResponseDto', () => {
  it('maps the vehicle model id and favorited flag', () => {
    const dto = new FavoriteStatusResponseDto('vm-1', true);

    expect(dto).toMatchObject({ vehicleModelId: 'vm-1', favorited: true });
  });
});
