import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCommentDto } from './update-comment.dto';

describe('UpdateCommentDto', () => {
  const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  beforeEach(() => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
  });

  afterEach(() => {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl;
  });

  it('passes validation with a body', async () => {
    const dto = plainToInstance(UpdateCommentDto, { body: 'Updated body' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when body is missing', async () => {
    const dto = plainToInstance(UpdateCommentDto, {});

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'body')).toBe(true);
  });

  it('fails validation when body is empty', async () => {
    const dto = plainToInstance(UpdateCommentDto, { body: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'body')).toBe(true);
  });

  it('passes validation when imageUrl is null (removes the image)', async () => {
    const dto = plainToInstance(UpdateCommentDto, {
      body: 'Updated body',
      imageUrl: null,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation when imageUrl is hosted under R2_PUBLIC_BASE_URL', async () => {
    const dto = plainToInstance(UpdateCommentDto, {
      body: 'Updated body',
      imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when imageUrl is hosted on an untrusted domain', async () => {
    const dto = plainToInstance(UpdateCommentDto, {
      body: 'Updated body',
      imageUrl: 'https://evil.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });
});
