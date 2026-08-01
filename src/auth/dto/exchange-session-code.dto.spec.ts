import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExchangeSessionCodeDto } from './exchange-session-code.dto';

describe('ExchangeSessionCodeDto', () => {
  it('passes validation with a code', async () => {
    const dto = plainToInstance(ExchangeSessionCodeDto, { code: 'xyz123' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when code is missing', async () => {
    const dto = plainToInstance(ExchangeSessionCodeDto, {});

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('fails validation when code is empty', async () => {
    const dto = plainToInstance(ExchangeSessionCodeDto, { code: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('fails validation when code exceeds the maximum length', async () => {
    const dto = plainToInstance(ExchangeSessionCodeDto, {
      code: 'a'.repeat(129),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });
});
