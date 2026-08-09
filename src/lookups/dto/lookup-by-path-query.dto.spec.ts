import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';
import { LookupByPathQueryDto } from './lookup-by-path-query.dto';

describe('LookupByPathQueryDto', () => {
  const validQuery = {
    make: 'volkswagen',
    model: 'polo',
    year: '2001',
    fuelType: FuelType.DIESEL,
    engine: '1-0',
  };

  it('passes validation and coerces year to a number', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2001);
  });

  it('fails validation when make is missing', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, {
      ...validQuery,
      make: '',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'make')).toBe(true);
  });

  it('fails validation when fuelType is missing', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, {
      make: 'volkswagen',
      model: 'polo',
      year: '2001',
      engine: '1-0',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'fuelType')).toBe(true);
  });

  it('fails validation when fuelType is not a known enum value', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, {
      ...validQuery,
      fuelType: 'kerosene',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'fuelType')).toBe(true);
  });

  it('passes validation without doors', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.doors).toBeUndefined();
  });

  it('fails validation when doors is above the maximum', async () => {
    const dto = plainToInstance(LookupByPathQueryDto, {
      ...validQuery,
      doors: '7',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'doors')).toBe(true);
  });

  it('accepts each valid language', async () => {
    for (const language of Object.values(LookupLocale)) {
      const dto = plainToInstance(LookupByPathQueryDto, {
        ...validQuery,
        language,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });
});
