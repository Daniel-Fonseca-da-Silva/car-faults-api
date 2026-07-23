import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LookupQueryDto } from './lookup-query.dto';

describe('LookupQueryDto', () => {
  const validQuery = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: '2001',
    engine: '1.0',
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
});
