import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserVehicleStatusQueryDto } from './user-vehicle-status-query.dto';

describe('UserVehicleStatusQueryDto', () => {
  it('passes validation with a vehicleModelId and year, coercing year to a number', async () => {
    const dto = plainToInstance(UserVehicleStatusQueryDto, {
      vehicleModelId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      year: '2001',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2001);
  });

  it('fails validation when vehicleModelId is not a uuid', async () => {
    const dto = plainToInstance(UserVehicleStatusQueryDto, {
      vehicleModelId: 'not-a-uuid',
      year: 2001,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'vehicleModelId')).toBe(
      true,
    );
  });

  it('fails validation when year is missing', async () => {
    const dto = plainToInstance(UserVehicleStatusQueryDto, {
      vehicleModelId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });
});
