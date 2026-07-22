import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserVehicleDto } from './create-user-vehicle.dto';

describe('CreateUserVehicleDto', () => {
  it('passes validation with brand/model/year/engine and coerces year to a number', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, {
      brand: 'Volkswagen',
      model: 'Polo',
      year: '2001',
      engine: '1.0',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2001);
  });

  it('passes validation with only vehicleModelId and year', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, {
      vehicleModelId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      year: 2001,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when brand/model/engine are missing and vehicleModelId is not set', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, { year: 2001 });

    const errors = await validate(dto);
    const properties = errors.map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining(['brand', 'model', 'engine']),
    );
  });

  it('fails validation when year is missing', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, {
      brand: 'Volkswagen',
      model: 'Polo',
      engine: '1.0',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });

  it('fails validation when vehicleModelId is not a UUID', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, {
      vehicleModelId: 'not-a-uuid',
      year: 2001,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'vehicleModelId')).toBe(
      true,
    );
  });

  it('fails validation when doors is out of range', async () => {
    const dto = plainToInstance(CreateUserVehicleDto, {
      brand: 'Volkswagen',
      model: 'Polo',
      year: 2001,
      engine: '1.0',
      doors: 10,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'doors')).toBe(true);
  });
});
