import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FixVoteValue } from '../enums/fix-vote-value.enum';
import { VoteFixDto } from './vote-fix.dto';

describe('VoteFixDto', () => {
  it('passes validation with "like"', async () => {
    const dto = plainToInstance(VoteFixDto, { value: FixVoteValue.LIKE });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with "dislike"', async () => {
    const dto = plainToInstance(VoteFixDto, { value: FixVoteValue.DISLIKE });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when value is missing', async () => {
    const dto = plainToInstance(VoteFixDto, {});

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'value')).toBe(true);
  });

  it('fails validation when value is not a known vote value', async () => {
    const dto = plainToInstance(VoteFixDto, { value: 'love' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'value')).toBe(true);
  });
});
