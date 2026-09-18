import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';
import { ReportContentType } from './enums/report-content-type.enum';
import { ReportReason } from './enums/report-reason.enum';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let reportsController: ReportsController;
  let reportsService: { create: jest.Mock };

  const user = { id: 'user-1' } as User;
  const req = { user } as unknown as Request;

  const report = {
    id: 'report-1',
    contentType: ReportContentType.COMMENT,
    contentId: 'comment-1',
    reason: ReportReason.SPAM,
    details: null,
    createdAt: new Date('2026-01-01'),
  } as Report;

  beforeEach(async () => {
    reportsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: reportsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    reportsController = module.get(ReportsController);
  });

  it('should be defined', () => {
    expect(reportsController).toBeDefined();
  });

  describe('create', () => {
    it('creates a report for the authenticated user', async () => {
      const dto: CreateReportDto = {
        contentType: ReportContentType.COMMENT,
        contentId: 'comment-1',
        reason: ReportReason.SPAM,
      };
      reportsService.create.mockResolvedValue(report);

      const result = await reportsController.create(req, dto);

      expect(reportsService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({ id: 'report-1' });
    });
  });
});
