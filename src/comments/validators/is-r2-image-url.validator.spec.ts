import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsR2ImageUrl } from './is-r2-image-url.validator';

class TestDto {
  @IsR2ImageUrl()
  imageUrl: unknown;
}

describe('IsR2ImageUrl', () => {
  const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  afterEach(() => {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl;
  });

  it('fails when the value is not a string', async () => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
    const dto = plainToInstance(TestDto, { imageUrl: 42 });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('fails when R2_PUBLIC_BASE_URL is not configured', async () => {
    delete process.env.R2_PUBLIC_BASE_URL;
    const dto = plainToInstance(TestDto, {
      imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('fails when the value is not a well-formed URL', async () => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
    const dto = plainToInstance(TestDto, { imageUrl: 'not-a-url' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('fails when the protocol is not https', async () => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
    const dto = plainToInstance(TestDto, {
      imageUrl: 'http://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('fails when the host does not match R2_PUBLIC_BASE_URL', async () => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
    const dto = plainToInstance(TestDto, {
      imageUrl: 'https://evil.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
  });

  it('passes when the URL is https and hosted under R2_PUBLIC_BASE_URL', async () => {
    process.env.R2_PUBLIC_BASE_URL = 'https://cdn.example.com';
    const dto = plainToInstance(TestDto, {
      imageUrl: 'https://cdn.example.com/comments/user-1/uuid.jpg',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
