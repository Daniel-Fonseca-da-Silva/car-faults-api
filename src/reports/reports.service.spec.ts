import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../comments/comments.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Report } from './entities/report.entity';
import { ReportContentType } from './enums/report-content-type.enum';
import { ReportReason } from './enums/report-reason.enum';
import { ReportStatus } from './enums/report-status.enum';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let reportsRepository: {
    findByReporterAndContent: jest.Mock;
    findPage: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let commentsService: { findById: jest.Mock; adminRemove: jest.Mock };
  let reviewsService: { findById: jest.Mock; adminRemove: jest.Mock };

  const reporterUserId = 'user-1';

  const buildReport = (overrides: Partial<Report> = {}) =>
    ({
      id: 'report-1',
      reporterUserId,
      contentType: ReportContentType.COMMENT,
      contentId: 'comment-1',
      reason: ReportReason.SPAM,
      details: null,
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as Report;

  beforeEach(async () => {
    reportsRepository = {
      findByReporterAndContent: jest.fn(),
      findPage: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    commentsService = { findById: jest.fn(), adminRemove: jest.fn() };
    reviewsService = { findById: jest.fn(), adminRemove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: reportsRepository },
        { provide: CommentsService, useValue: commentsService },
        { provide: ReviewsService, useValue: reviewsService },
      ],
    }).compile();

    reportsService = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(reportsService).toBeDefined();
  });

  describe('create', () => {
    it('creates a report for an existing comment', async () => {
      commentsService.findById.mockResolvedValue({
        id: 'comment-1',
      });
      reportsRepository.findByReporterAndContent.mockResolvedValue(null);
      const created = buildReport();
      reportsRepository.create.mockReturnValue(created);
      reportsRepository.save.mockResolvedValue(created);

      const result = await reportsService.create(reporterUserId, {
        contentType: ReportContentType.COMMENT,
        contentId: 'comment-1',
        reason: ReportReason.SPAM,
      });

      expect(commentsService.findById).toHaveBeenCalledWith('comment-1');
      expect(reviewsService.findById).not.toHaveBeenCalled();
      expect(reportsRepository.create).toHaveBeenCalledWith({
        reporterUserId,
        contentType: ReportContentType.COMMENT,
        contentId: 'comment-1',
        reason: ReportReason.SPAM,
        details: null,
      });
      expect(result).toBe(created);
    });

    it('creates a report for an existing review', async () => {
      reviewsService.findById.mockResolvedValue({ id: 'review-1' });
      reportsRepository.findByReporterAndContent.mockResolvedValue(null);
      const created = buildReport({
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
      });
      reportsRepository.create.mockReturnValue(created);
      reportsRepository.save.mockResolvedValue(created);

      const result = await reportsService.create(reporterUserId, {
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
        reason: ReportReason.HARASSMENT,
        details: 'Repeated personal attacks.',
      });

      expect(reviewsService.findById).toHaveBeenCalledWith('review-1');
      expect(commentsService.findById).not.toHaveBeenCalled();
      expect(reportsRepository.create).toHaveBeenCalledWith({
        reporterUserId,
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
        reason: ReportReason.HARASSMENT,
        details: 'Repeated personal attacks.',
      });
      expect(result).toBe(created);
    });

    it('throws NotFoundException when the reported comment does not exist', async () => {
      commentsService.findById.mockResolvedValue(null);

      await expect(
        reportsService.create(reporterUserId, {
          contentType: ReportContentType.COMMENT,
          contentId: 'missing',
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(reportsRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the reported review does not exist', async () => {
      reviewsService.findById.mockResolvedValue(null);

      await expect(
        reportsService.create(reporterUserId, {
          contentType: ReportContentType.REVIEW,
          contentId: 'missing',
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(reportsRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user already reported this content', async () => {
      commentsService.findById.mockResolvedValue({
        id: 'comment-1',
      });
      reportsRepository.findByReporterAndContent.mockResolvedValue(
        buildReport(),
      );

      await expect(
        reportsService.create(reporterUserId, {
          contentType: ReportContentType.COMMENT,
          contentId: 'comment-1',
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(ConflictException);
      expect(reportsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findPage', () => {
    it('enriches each report with the reported content preview', async () => {
      const commentReport = buildReport({ id: 'report-1' });
      const reviewReport = buildReport({
        id: 'report-2',
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
      });
      reportsRepository.findPage.mockResolvedValue([
        commentReport,
        reviewReport,
      ]);
      commentsService.findById.mockResolvedValue({
        id: 'comment-1',
        body: 'Buy cheap watches now',
      });
      reviewsService.findById.mockResolvedValue({
        id: 'review-1',
        comment: 'You are all idiots',
      });

      const result = await reportsService.findPage({});

      expect(reportsRepository.findPage).toHaveBeenCalledWith(
        undefined,
        20,
        undefined,
      );
      expect(result.items).toEqual([
        {
          report: commentReport,
          contentPreview: 'Buy cheap watches now',
          contentExists: true,
        },
        {
          report: reviewReport,
          contentPreview: 'You are all idiots',
          contentExists: true,
        },
      ]);
      expect(result.nextCursor).toBeNull();
    });

    it('passes the status filter through to the repository', async () => {
      reportsRepository.findPage.mockResolvedValue([]);

      await reportsService.findPage({ status: ReportStatus.PENDING });

      expect(reportsRepository.findPage).toHaveBeenCalledWith(
        ReportStatus.PENDING,
        20,
        undefined,
      );
    });

    it('reports a null preview and contentExists=false when the reported content no longer exists', async () => {
      const report = buildReport();
      reportsRepository.findPage.mockResolvedValue([report]);
      commentsService.findById.mockResolvedValue(null);

      const result = await reportsService.findPage({});

      expect(result.items).toEqual([
        { report, contentPreview: null, contentExists: false },
      ]);
    });

    it('reports contentExists=true with a null preview when a review has no comment text', async () => {
      const report = buildReport({
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
      });
      reportsRepository.findPage.mockResolvedValue([report]);
      reviewsService.findById.mockResolvedValue({
        id: 'review-1',
        comment: null,
      });

      const result = await reportsService.findPage({});

      expect(result.items).toEqual([
        { report, contentPreview: null, contentExists: true },
      ]);
    });
  });

  describe('updateStatus', () => {
    it('updates the status of an existing report', async () => {
      const report = buildReport({ status: ReportStatus.PENDING });
      reportsRepository.findById.mockResolvedValue(report);
      reportsRepository.save.mockImplementation((value: Report) =>
        Promise.resolve(value),
      );

      const result = await reportsService.updateStatus(
        'report-1',
        ReportStatus.REVIEWED,
      );

      expect(reportsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatus.REVIEWED }),
      );
      expect(result.status).toBe(ReportStatus.REVIEWED);
    });

    it('throws NotFoundException when the report does not exist', async () => {
      reportsRepository.findById.mockResolvedValue(null);

      await expect(
        reportsService.updateStatus('missing', ReportStatus.DISMISSED),
      ).rejects.toThrow(NotFoundException);
      expect(reportsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeContent', () => {
    it('deletes the reported comment and marks the report reviewed', async () => {
      const report = buildReport({
        contentType: ReportContentType.COMMENT,
        contentId: 'comment-1',
        status: ReportStatus.PENDING,
      });
      reportsRepository.findById.mockResolvedValue(report);
      commentsService.adminRemove.mockResolvedValue(undefined);
      reportsRepository.save.mockImplementation((value: Report) =>
        Promise.resolve(value),
      );

      const result = await reportsService.removeContent('report-1');

      expect(commentsService.adminRemove).toHaveBeenCalledWith('comment-1');
      expect(reviewsService.adminRemove).not.toHaveBeenCalled();
      expect(reportsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatus.REVIEWED }),
      );
      expect(result.status).toBe(ReportStatus.REVIEWED);
    });

    it('deletes the reported review and marks the report reviewed', async () => {
      const report = buildReport({
        contentType: ReportContentType.REVIEW,
        contentId: 'review-1',
        status: ReportStatus.PENDING,
      });
      reportsRepository.findById.mockResolvedValue(report);
      reviewsService.adminRemove.mockResolvedValue(undefined);
      reportsRepository.save.mockImplementation((value: Report) =>
        Promise.resolve(value),
      );

      const result = await reportsService.removeContent('report-1');

      expect(reviewsService.adminRemove).toHaveBeenCalledWith('review-1');
      expect(commentsService.adminRemove).not.toHaveBeenCalled();
      expect(result.status).toBe(ReportStatus.REVIEWED);
    });

    it('throws NotFoundException when the report does not exist', async () => {
      reportsRepository.findById.mockResolvedValue(null);

      await expect(reportsService.removeContent('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsService.adminRemove).not.toHaveBeenCalled();
      expect(reportsRepository.save).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException when the reported content was already removed', async () => {
      const report = buildReport();
      reportsRepository.findById.mockResolvedValue(report);
      commentsService.adminRemove.mockRejectedValue(
        new NotFoundException('Comment comment-1 not found'),
      );

      await expect(reportsService.removeContent('report-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(reportsRepository.save).not.toHaveBeenCalled();
    });
  });
});
