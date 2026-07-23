import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateReviewDto } from './update-review.dto';

describe('UpdateReviewDto', () => {
  it('passes validation with no fields set', async () => {
    const dto = plainToInstance(UpdateReviewDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with only rating, coercing it to a number', async () => {
    const dto = plainToInstance(UpdateReviewDto, { rating: '5' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.rating).toBe(5);
  });

  it('passes validation with only comment', async () => {
    const dto = plainToInstance(UpdateReviewDto, { comment: 'Updated' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when comment is not a string', async () => {
    const dto = plainToInstance(UpdateReviewDto, { comment: 123 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'comment')).toBe(true);
  });

  it('fails validation when rating is below the minimum', async () => {
    const dto = plainToInstance(UpdateReviewDto, { rating: 0 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('fails validation when rating is above the maximum', async () => {
    const dto = plainToInstance(UpdateReviewDto, { rating: 6 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('fails validation when rating is not an integer', async () => {
    const dto = plainToInstance(UpdateReviewDto, { rating: 3.5 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });
});
