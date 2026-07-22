import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserVehicleDto } from './update-user-vehicle.dto';

describe('UpdateUserVehicleDto', () => {
  it('passes validation with no fields set', async () => {
    const dto = plainToInstance(UpdateUserVehicleDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a partial update and coerces year to a number', async () => {
    const dto = plainToInstance(UpdateUserVehicleDto, { year: '2005' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2005);
  });

  it('fails validation when vehicleModelId is not a UUID', async () => {
    const dto = plainToInstance(UpdateUserVehicleDto, {
      vehicleModelId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'vehicleModelId')).toBe(
      true,
    );
  });

  it('fails validation when doors is out of range', async () => {
    const dto = plainToInstance(UpdateUserVehicleDto, { doors: 0 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'doors')).toBe(true);
  });

  it('fails validation when name exceeds the max length', async () => {
    const dto = plainToInstance(UpdateUserVehicleDto, {
      name: 'a'.repeat(121),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });
});
