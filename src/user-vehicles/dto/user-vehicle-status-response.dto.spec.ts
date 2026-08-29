import { UserVehicleStatusResponseDto } from './user-vehicle-status-response.dto';

describe('UserVehicleStatusResponseDto', () => {
  it('maps the vehicle model id, year and owned flag', () => {
    const dto = new UserVehicleStatusResponseDto('vm-1', 2001, true);

    expect(dto).toMatchObject({
      vehicleModelId: 'vm-1',
      year: 2001,
      owned: true,
    });
  });
});
