import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';

describe('CreateReviewDto', () => {
  it('passes validation with knownIssueId and rating, coercing rating to a number', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: '4',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.rating).toBe(4);
  });

  it('passes validation with an optional comment', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: 5,
      comment: 'Great fix guide',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when comment is not a string', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: 4,
      comment: 123,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'comment')).toBe(true);
  });

  it('fails validation when knownIssueId is missing', async () => {
    const dto = plainToInstance(CreateReviewDto, { rating: 4 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when knownIssueId is not a UUID', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'not-a-uuid',
      rating: 4,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when rating is missing', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('fails validation when rating is below the minimum', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: 0,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('fails validation when rating is above the maximum', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: 6,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('fails validation when rating is not an integer', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      rating: 3.5,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });
});
