import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { FuelType } from '../../vehicle-models/enums/fuel-type.enum';
import { LookupQueryDto } from './lookup-query.dto';

describe('LookupQueryDto', () => {
  const validQuery = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: '2001',
    engine: '1.0',
    fuelType: FuelType.DIESEL,
  };

  it('passes validation and coerces year to a number', async () => {
    const dto = plainToInstance(LookupQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2001);
  });

  it('fails validation when brand is missing', async () => {
    const dto = plainToInstance(LookupQueryDto, { ...validQuery, brand: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'brand')).toBe(true);
  });

  it('fails validation when year is not an integer', async () => {
    const dto = plainToInstance(LookupQueryDto, {
      ...validQuery,
      year: 'not-a-year',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });

  it('fails validation when year is below the minimum', async () => {
    const dto = plainToInstance(LookupQueryDto, {
      ...validQuery,
      year: '1800',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });

  it('passes validation without doors', async () => {
    const dto = plainToInstance(LookupQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.doors).toBeUndefined();
  });

  it('passes validation and coerces doors to a number', async () => {
    const dto = plainToInstance(LookupQueryDto, { ...validQuery, doors: '3' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.doors).toBe(3);
  });

  it('fails validation when doors is below the minimum', async () => {
    const dto = plainToInstance(LookupQueryDto, { ...validQuery, doors: '0' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'doors')).toBe(true);
  });

  it('fails validation when doors is above the maximum', async () => {
    const dto = plainToInstance(LookupQueryDto, { ...validQuery, doors: '7' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'doors')).toBe(true);
  });

  it('fails validation when fuelType is missing', async () => {
    const dto = plainToInstance(LookupQueryDto, {
      brand: 'Volkswagen',
      model: 'Polo',
      year: '2001',
      engine: '1.0',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'fuelType')).toBe(true);
  });

  it('fails validation when fuelType is not a known enum value', async () => {
    const dto = plainToInstance(LookupQueryDto, {
      ...validQuery,
      fuelType: 'kerosene',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'fuelType')).toBe(true);
  });

  it('accepts each valid fuel type', async () => {
    for (const fuelType of Object.values(FuelType)) {
      const dto = plainToInstance(LookupQueryDto, { ...validQuery, fuelType });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });

  it('passes validation without language', async () => {
    const dto = plainToInstance(LookupQueryDto, validQuery);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.language).toBeUndefined();
  });

  it('fails validation when language is not a known enum value', async () => {
    const dto = plainToInstance(LookupQueryDto, {
      ...validQuery,
      language: 'fr-FR',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'language')).toBe(true);
  });

  it('accepts each valid language', async () => {
    for (const language of Object.values(LookupLocale)) {
      const dto = plainToInstance(LookupQueryDto, { ...validQuery, language });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });
});
