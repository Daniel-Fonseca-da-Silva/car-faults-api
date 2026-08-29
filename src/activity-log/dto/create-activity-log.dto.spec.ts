import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActivityLogType } from '../enums/activity-log-type.enum';
import { CreateActivityLogDto } from './create-activity-log.dto';

describe('CreateActivityLogDto', () => {
  const resourceId = 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d';

  it('passes validation for a defect_consulted activity', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.DEFECT_CONSULTED,
      resourceId,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation for a vehicle_favorite activity', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when type is search (not user-creatable)', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.SEARCH,
      resourceId,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });

  it('fails validation when resourceId is missing', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.DEFECT_CONSULTED,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'resourceId')).toBe(true);
  });

  it('fails validation when resourceId is not a uuid', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.DEFECT_CONSULTED,
      resourceId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'resourceId')).toBe(true);
  });

  it('passes validation for a vehicle_favorite activity with a year and coerces it to a number', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId,
      year: '2001',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2001);
  });

  it('fails validation when year is below the minimum', async () => {
    const dto = plainToInstance(CreateActivityLogDto, {
      type: ActivityLogType.VEHICLE_FAVORITE,
      resourceId,
      year: 1899,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'year')).toBe(true);
  });
});
