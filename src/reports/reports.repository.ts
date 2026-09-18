import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { ReportContentType } from './enums/report-content-type.enum';
import { ReportStatus } from './enums/report-status.enum';
import { Report } from './entities/report.entity';

export interface ReportCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectRepository(Report)
    private readonly repository: Repository<Report>,
  ) {}

  findByReporterAndContent(
    reporterUserId: string,
    contentType: ReportContentType,
    contentId: string,
  ): Promise<Report | null> {
    return this.repository.findOne({
      where: { reporterUserId, contentType, contentId },
    });
  }

  findPage(
    status: ReportStatus | undefined,
    limit: number,
    cursor?: ReportCursor,
  ): Promise<Report[]> {
    const qb = this.repository
      .createQueryBuilder('report')
      .orderBy('report.createdAt', 'DESC')
      .addOrderBy('report.id', 'DESC')
      .take(limit + 1);

    if (status) {
      qb.andWhere('report.status = :status', { status });
    }

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          { expr: 'report.createdAt', direction: 'DESC', param: 'createdAt' },
          { expr: 'report.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getMany();
  }

  findById(id: string): Promise<Report | null> {
    return this.repository.findOne({ where: { id } });
  }

  create(data: Partial<Report>): Report {
    return this.repository.create(data);
  }

  save(report: Report): Promise<Report> {
    return this.repository.save(report);
  }
}
