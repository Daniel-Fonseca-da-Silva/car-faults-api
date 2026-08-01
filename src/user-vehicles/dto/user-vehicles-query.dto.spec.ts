import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LookupLocale } from '../../common/enums/lookup-locale.enum';
import { UserVehiclesQueryDto } from './user-vehicles-query.dto';

describe('UserVehiclesQueryDto', () => {
  it('passes validation without a language', async () => {
    const dto = plainToInstance(UserVehiclesQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.language).toBeUndefined();
  });

  it('passes validation with a supported language', async () => {
    const dto = plainToInstance(UserVehiclesQueryDto, {
      language: LookupLocale.PtPt,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.language).toBe(LookupLocale.PtPt);
  });

  it('fails validation for an unsupported language', async () => {
    const dto = plainToInstance(UserVehiclesQueryDto, {
      language: 'fr-FR',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'language')).toBe(true);
  });
});
