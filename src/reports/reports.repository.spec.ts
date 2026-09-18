import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportContentType } from './enums/report-content-type.enum';
import { ReportReason } from './enums/report-reason.enum';
import { ReportStatus } from './enums/report-status.enum';
import { ReportsRepository } from './reports.repository';

describe('ReportsRepository', () => {
  let reportsRepository: ReportsRepository;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    andWhere: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsRepository,
        {
          provide: getRepositoryToken(Report),
          useValue: repository,
        },
      ],
    }).compile();

    reportsRepository = module.get(ReportsRepository);
  });

  it('should be defined', () => {
    expect(reportsRepository).toBeDefined();
  });

  describe('findByReporterAndContent', () => {
    it('queries by reporterUserId, contentType and contentId', async () => {
      const report = { id: 'report-1' } as Report;
      repository.findOne.mockResolvedValue(report);

      const result = await reportsRepository.findByReporterAndContent(
        'user-1',
        ReportContentType.COMMENT,
        'comment-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          reporterUserId: 'user-1',
          contentType: ReportContentType.COMMENT,
          contentId: 'comment-1',
        },
      });
      expect(result).toBe(report);
    });
  });

  describe('findPage', () => {
    it('orders by createdAt/id desc and takes limit + 1', async () => {
      const reports = [{ id: 'report-1' }] as Report[];
      queryBuilder.getMany.mockResolvedValue(reports);

      const result = await reportsRepository.findPage(undefined, 20);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('report');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'report.createdAt',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('report.id', 'DESC');
      expect(queryBuilder.take).toHaveBeenCalledWith(21);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toBe(reports);
    });

    it('filters by status when provided', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await reportsRepository.findPage(ReportStatus.PENDING, 20);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status = :status',
        { status: ReportStatus.PENDING },
      );
    });

    it('applies the keyset cursor when provided', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await reportsRepository.findPage(undefined, 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'report-1',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'report-1',
        }),
      );
    });
  });

  describe('findById', () => {
    it('queries by id', async () => {
      const report = { id: 'report-1' } as Report;
      repository.findOne.mockResolvedValue(report);

      const result = await reportsRepository.findById('report-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'report-1' },
      });
      expect(result).toBe(report);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = {
        reporterUserId: 'user-1',
        contentType: ReportContentType.COMMENT,
        contentId: 'comment-1',
        reason: ReportReason.SPAM,
      };
      const created = { id: 'report-1', ...data } as Report;
      repository.create.mockReturnValue(created);

      const result = reportsRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const report = { id: 'report-1' } as Report;
      repository.save.mockResolvedValue(report);

      const result = await reportsRepository.save(report);

      expect(repository.save).toHaveBeenCalledWith(report);
      expect(result).toBe(report);
    });
  });
});
