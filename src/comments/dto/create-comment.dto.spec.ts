import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

describe('CreateCommentDto', () => {
  const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  beforeEach(() => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
  });

  afterEach(() => {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl;
  });

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

  it('passes validation when imageUrl is omitted', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: 'Some comment',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation when imageUrl is hosted under R2_PUBLIC_BASE_URL', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: 'Some comment',
      imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when imageUrl is not https', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: 'Some comment',
      imageUrl: 'http://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('fails validation when imageUrl is hosted on an untrusted domain', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      body: 'Some comment',
      imageUrl: 'https://evil.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });
});
