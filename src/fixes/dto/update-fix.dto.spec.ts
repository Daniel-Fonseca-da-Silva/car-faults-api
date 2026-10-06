import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateFixDto } from './update-fix.dto';

describe('UpdateFixDto', () => {
  it('passes validation with no fields set', async () => {
    const dto = plainToInstance(UpdateFixDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with only summary', async () => {
    const dto = plainToInstance(UpdateFixDto, { summary: 'Updated summary' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with only steps', async () => {
    const dto = plainToInstance(UpdateFixDto, { steps: 'Updated steps' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when summary is empty', async () => {
    const dto = plainToInstance(UpdateFixDto, { summary: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'summary')).toBe(true);
  });

  it('fails validation when steps is empty', async () => {
    const dto = plainToInstance(UpdateFixDto, { steps: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'steps')).toBe(true);
  });
});
