import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminCreateKnownIssueDto } from './create-known-issue.dto';
import { IssueSeverity } from '../../known-issues/enums/issue-severity.enum';

describe('AdminCreateKnownIssueDto', () => {
  const base = {
    vehicleModelId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
    title: 'Problematic gearbox',
    description: 'Synchros wear out prematurely under normal use.',
    severity: IssueSeverity.HIGH,
  };

  it('passes validation with a real https source url', async () => {
    const dto = plainToInstance(AdminCreateKnownIssueDto, {
      ...base,
      sources: [
        'https://www.auto-doc.pt/info/volkswagen-polo-problemas-associados',
      ],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when a source exceeds 200 characters', async () => {
    const dto = plainToInstance(AdminCreateKnownIssueDto, {
      ...base,
      sources: [`https://example.com/${'a'.repeat(200)}`],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'sources')).toBe(true);
  });
});
