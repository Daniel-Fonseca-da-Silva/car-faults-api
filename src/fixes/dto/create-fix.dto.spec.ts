import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFixDto } from './create-fix.dto';

describe('CreateFixDto', () => {
  const base = {
    knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    summary: 'Replace gearbox synchros',
    steps: 'Remove gearbox, replace synchro rings, reassemble.',
  };

  it('passes validation with the required fields', async () => {
    const dto = plainToInstance(CreateFixDto, base);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with an optional estimatedCostEur, coercing it to a number', async () => {
    const dto = plainToInstance(CreateFixDto, {
      ...base,
      estimatedCostEur: '450',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.estimatedCostEur).toBe(450);
  });

  it('fails validation when knownIssueId is missing', async () => {
    const dto = plainToInstance(CreateFixDto, {
      summary: base.summary,
      steps: base.steps,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when knownIssueId is not a UUID', async () => {
    const dto = plainToInstance(CreateFixDto, {
      ...base,
      knownIssueId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when summary is empty', async () => {
    const dto = plainToInstance(CreateFixDto, { ...base, summary: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'summary')).toBe(true);
  });

  it('fails validation when steps is empty', async () => {
    const dto = plainToInstance(CreateFixDto, { ...base, steps: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'steps')).toBe(true);
  });

  it('fails validation when estimatedCostEur is negative', async () => {
    const dto = plainToInstance(CreateFixDto, {
      ...base,
      estimatedCostEur: -1,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'estimatedCostEur')).toBe(
      true,
    );
  });
});
