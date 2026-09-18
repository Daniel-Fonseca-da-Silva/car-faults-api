import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportContentType } from '../enums/report-content-type.enum';
import { ReportReason } from '../enums/report-reason.enum';
import { CreateReportDto } from './create-report.dto';

describe('CreateReportDto', () => {
  it('passes validation with a valid comment report', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: ReportContentType.COMMENT,
      contentId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      reason: ReportReason.SPAM,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with optional details', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: ReportContentType.REVIEW,
      contentId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      reason: ReportReason.OTHER,
      details: 'Contains a phone number soliciting off-app payment.',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when contentType is not a known type', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: 'fix',
      contentId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      reason: ReportReason.SPAM,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'contentType')).toBe(true);
  });

  it('fails validation when contentId is not a uuid', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: ReportContentType.COMMENT,
      contentId: 'not-a-uuid',
      reason: ReportReason.SPAM,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'contentId')).toBe(true);
  });

  it('fails validation when reason is not a known reason', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: ReportContentType.COMMENT,
      contentId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      reason: 'love',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });

  it('fails validation when details exceeds the max length', async () => {
    const dto = plainToInstance(CreateReportDto, {
      contentType: ReportContentType.COMMENT,
      contentId: 'b3a5c1d2-4e6f-4a8b-9c0d-1e2f3a4b5c6d',
      reason: ReportReason.SPAM,
      details: 'a'.repeat(1001),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'details')).toBe(true);
  });
});
