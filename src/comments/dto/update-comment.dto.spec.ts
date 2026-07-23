import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCommentDto } from './update-comment.dto';

describe('UpdateCommentDto', () => {
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
});
