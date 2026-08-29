import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CursorPaginationQueryDto, resolveLimit } from './cursor-query.dto';

describe('CursorPaginationQueryDto', () => {
  it('passes validation with no fields set', async () => {
    const dto = plainToInstance(CursorPaginationQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a cursor and coerces limit to a number', async () => {
    const dto = plainToInstance(CursorPaginationQueryDto, {
      cursor: 'abc',
      limit: '10',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(10);
  });

  it('fails validation when limit is not a positive integer', async () => {
    const dto = plainToInstance(CursorPaginationQueryDto, { limit: 0 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('fails validation when cursor is not a string', async () => {
    const dto = plainToInstance(CursorPaginationQueryDto, { cursor: 123 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'cursor')).toBe(true);
  });
});

describe('resolveLimit', () => {
  it('returns the default when limit is undefined', () => {
    expect(resolveLimit(undefined, { default: 20, max: 100 })).toBe(20);
  });

  it('returns the requested limit when within bounds', () => {
    expect(resolveLimit(50, { default: 20, max: 100 })).toBe(50);
  });

  it('clamps the requested limit to the maximum', () => {
    expect(resolveLimit(500, { default: 20, max: 100 })).toBe(100);
  });
});
