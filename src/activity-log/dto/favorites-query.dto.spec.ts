import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FavoritesQueryDto } from './favorites-query.dto';

describe('FavoritesQueryDto', () => {
  it('passes validation with no fields set', async () => {
    const dto = plainToInstance(FavoritesQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a cursor and limit', async () => {
    const dto = plainToInstance(FavoritesQueryDto, {
      cursor: 'abc',
      limit: 10,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
