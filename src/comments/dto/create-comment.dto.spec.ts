import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

describe('CreateCommentDto', () => {
  it('passes validation with knownIssueId and body', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: 'Had the same issue at 90k km.',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when knownIssueId is missing', async () => {
    const dto = plainToInstance(CreateCommentDto, { body: 'Some comment' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when knownIssueId is not a UUID', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'not-a-uuid',
      body: 'Some comment',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when body is missing', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'body')).toBe(true);
  });

  it('fails validation when body is empty', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: '',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'body')).toBe(true);
  });
});
