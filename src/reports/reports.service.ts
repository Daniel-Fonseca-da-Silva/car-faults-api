import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsService } from '../comments/comments.service';
import { ReviewsService } from '../reviews/reviews.service';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import { resolveLimit } from '../common/pagination/cursor-query.dto';
import { splitPage } from '../common/pagination/paginate.util';
import { Report } from './entities/report.entity';
import { ReportContentType } from './enums/report-content-type.enum';
import { ReportReason } from './enums/report-reason.enum';
import { ReportStatus } from './enums/report-status.enum';
import { ReportCursor, ReportsRepository } from './reports.repository';

export const REPORTS_DEFAULT_LIMIT = 20;
export const REPORTS_MAX_LIMIT = 100;

export interface CreateReportData {
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  details?: string;
}

export interface ReportListItem {
  report: Report;
  contentPreview: string | null;
  contentExists: boolean;
}

export interface ReportsPage {
  items: ReportListItem[];
  nextCursor: string | null;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly commentsService: CommentsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async create(
    reporterUserId: string,
    data: CreateReportData,
  ): Promise<Report> {
    const content =
      data.contentType === ReportContentType.COMMENT
        ? await this.commentsService.findById(data.contentId)
        : await this.reviewsService.findById(data.contentId);
    if (!content) {
      throw new NotFoundException(
        `${data.contentType} ${data.contentId} not found`,
      );
    }

    const existing = await this.reportsRepository.findByReporterAndContent(
      reporterUserId,
      data.contentType,
      data.contentId,
    );
    if (existing) {
      throw new ConflictException('You have already reported this content');
    }

    const report = this.reportsRepository.create({
      reporterUserId,
      contentType: data.contentType,
      contentId: data.contentId,
      reason: data.reason,
      details: data.details ?? null,
    });
    return this.reportsRepository.save(report);
  }

  async findPage(query: {
    status?: ReportStatus;
    cursor?: string;
    limit?: number;
  }): Promise<ReportsPage> {
    const limit = resolveLimit(query.limit, {
      default: REPORTS_DEFAULT_LIMIT,
      max: REPORTS_MAX_LIMIT,
    });
    const cursor = query.cursor
      ? decodeCursor<ReportCursor>(query.cursor)
      : undefined;

    const rows = await this.reportsRepository.findPage(
      query.status,
      limit,
      cursor,
    );
    const { items, hasMore } = splitPage(rows, limit);

    const withPreview = await Promise.all(
      items.map(async (report) => {
        const { preview, exists } = await this.getContentInfo(report);
        return { report, contentPreview: preview, contentExists: exists };
      }),
    );

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null;

    return { items: withPreview, nextCursor };
  }

  async updateStatus(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }
    report.status = status;
    return this.reportsRepository.save(report);
  }

  async removeContent(id: string): Promise<Report> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    if (report.contentType === ReportContentType.COMMENT) {
      await this.commentsService.adminRemove(report.contentId);
    } else {
      await this.reviewsService.adminRemove(report.contentId);
    }

    report.status = ReportStatus.REVIEWED;
    return this.reportsRepository.save(report);
  }

  private async getContentInfo(
    report: Report,
  ): Promise<{ preview: string | null; exists: boolean }> {
    if (report.contentType === ReportContentType.COMMENT) {
      const comment = await this.commentsService.findById(report.contentId);
      return { exists: comment !== null, preview: comment?.body ?? null };
    }
    const review = await this.reviewsService.findById(report.contentId);
    return { exists: review !== null, preview: review?.comment ?? null };
  }
}
