import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Report } from '../reports/entities/report.entity';
import { ReportContentType } from '../reports/enums/report-content-type.enum';
import { ReportReason } from '../reports/enums/report-reason.enum';
import { ReportStatus } from '../reports/enums/report-status.enum';
import { ReportsService } from '../reports/reports.service';
import { AdminReportsController } from './admin-reports.controller';

describe('AdminReportsController', () => {
  let controller: AdminReportsController;
  let reportsService: {
    findPage: jest.Mock;
    updateStatus: jest.Mock;
    removeContent: jest.Mock;
  };

  const report = {
    id: 'report-1',
    reporterUserId: 'user-1',
    contentType: ReportContentType.COMMENT,
    contentId: 'comment-1',
    reason: ReportReason.SPAM,
    details: null,
    status: ReportStatus.PENDING,
    createdAt: new Date('2026-01-01'),
  } as Report;

  beforeEach(async () => {
    reportsService = {
      findPage: jest.fn(),
      updateStatus: jest.fn(),
      removeContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [{ provide: ReportsService, useValue: reportsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('lists reports with their content preview', async () => {
      reportsService.findPage.mockResolvedValue({
        items: [
          {
            report,
            contentPreview: 'Buy cheap watches now',
            contentExists: true,
          },
        ],
        nextCursor: null,
      });
      const query = { status: ReportStatus.PENDING };

      const result = await controller.findAll(query);

      expect(reportsService.findPage).toHaveBeenCalledWith(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].contentPreview).toBe('Buy cheap watches now');
      expect(result.items[0].contentExists).toBe(true);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('update', () => {
    it('updates the report status', async () => {
      const reviewed = { ...report, status: ReportStatus.REVIEWED } as Report;
      reportsService.updateStatus.mockResolvedValue(reviewed);

      const result = await controller.update('report-1', {
        status: ReportStatus.REVIEWED,
      });

      expect(reportsService.updateStatus).toHaveBeenCalledWith(
        'report-1',
        ReportStatus.REVIEWED,
      );
      expect(result.status).toBe(ReportStatus.REVIEWED);
    });
  });

  describe('removeContent', () => {
    it('deletes the reported content and returns the updated report', async () => {
      const reviewed = { ...report, status: ReportStatus.REVIEWED } as Report;
      reportsService.removeContent.mockResolvedValue(reviewed);

      const result = await controller.removeContent('report-1');

      expect(reportsService.removeContent).toHaveBeenCalledWith('report-1');
      expect(result.status).toBe(ReportStatus.REVIEWED);
      expect(result.contentExists).toBe(false);
    });
  });
});
