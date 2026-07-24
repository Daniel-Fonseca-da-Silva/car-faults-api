import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListFixesQueryDto } from './list-fixes-query.dto';

describe('ListFixesQueryDto', () => {
  it('passes validation with a valid knownIssueId', async () => {
    const dto = plainToInstance(ListFixesQueryDto, {
      knownIssueId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when knownIssueId is missing', async () => {
    const dto = plainToInstance(ListFixesQueryDto, {});

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });

  it('fails validation when knownIssueId is not a UUID', async () => {
    const dto = plainToInstance(ListFixesQueryDto, {
      knownIssueId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'knownIssueId')).toBe(
      true,
    );
  });
});
