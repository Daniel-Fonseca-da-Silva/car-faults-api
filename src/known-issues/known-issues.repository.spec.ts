import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';

describe('KnownIssuesRepository', () => {
  let knownIssuesRepository: KnownIssuesRepository;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    innerJoin: jest.Mock;
    leftJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    having: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnownIssuesRepository,
        {
          provide: getRepositoryToken(KnownIssue),
          useValue: repository,
        },
      ],
    }).compile();

    knownIssuesRepository = module.get(KnownIssuesRepository);
  });

  it('should be defined', () => {
    expect(knownIssuesRepository).toBeDefined();
  });

  describe('findByVehicleModelId', () => {
    it('delegates to repository.find with fixes relation', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      repository.find.mockResolvedValue(knownIssues);

      const result = await knownIssuesRepository.findByVehicleModelId('vm-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { vehicleModelId: 'vm-1' },
        relations: { fixes: true },
      });
      expect(result).toBe(knownIssues);
    });
  });

  describe('findByVehicleModelIdAndLocale', () => {
    it('delegates to repository.find with fixes relation filtered by locale', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      repository.find.mockResolvedValue(knownIssues);

      const result = await knownIssuesRepository.findByVehicleModelIdAndLocale(
        'vm-1',
        LookupLocale.PtPt,
      );

      expect(repository.find).toHaveBeenCalledWith({
        where: { vehicleModelId: 'vm-1', locale: LookupLocale.PtPt },
        relations: { fixes: true },
      });
      expect(result).toBe(knownIssues);
    });
  });

  describe('countByVehicleModelId', () => {
    it('delegates to repository.count filtered by vehicle model', async () => {
      repository.count.mockResolvedValue(3);

      const result = await knownIssuesRepository.countByVehicleModelId('vm-1');

      expect(repository.count).toHaveBeenCalledWith({
        where: { vehicleModelId: 'vm-1' },
      });
      expect(result).toBe(3);
    });
  });

  describe('countByVehicleModelIdAndLocale', () => {
    it('delegates to repository.count filtered by vehicle model and locale', async () => {
      repository.count.mockResolvedValue(2);

      const result = await knownIssuesRepository.countByVehicleModelIdAndLocale(
        'vm-1',
        LookupLocale.PtPt,
      );

      expect(repository.count).toHaveBeenCalledWith({
        where: { vehicleModelId: 'vm-1', locale: LookupLocale.PtPt },
      });
      expect(result).toBe(2);
    });
  });

  describe('findById', () => {
    it('delegates to repository.findOne by id', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      repository.findOne.mockResolvedValue(knownIssue);

      const result = await knownIssuesRepository.findById('ki-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'ki-1' },
      });
      expect(result).toBe(knownIssue);
    });

    it('returns null when the known issue does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await knownIssuesRepository.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('saveMany', () => {
    it('saves through the given manager', async () => {
      const data = [{ title: 'Gearbox' }];
      const saved = [{ id: 'ki-1', ...data[0] }] as KnownIssue[];
      const managerRepository = { save: jest.fn().mockResolvedValue(saved) };
      const getRepository = jest.fn().mockReturnValue(managerRepository);
      const manager = { getRepository } as unknown as EntityManager;

      const result = await knownIssuesRepository.saveMany(data, manager);

      expect(getRepository).toHaveBeenCalledWith(KnownIssue);
      expect(managerRepository.save).toHaveBeenCalledWith(data);
      expect(result).toBe(saved);
    });
  });

  describe('countAll', () => {
    it('delegates to repository.count', async () => {
      repository.count.mockResolvedValue(34000);

      const result = await knownIssuesRepository.countAll();

      expect(repository.count).toHaveBeenCalledWith();
      expect(result).toBe(34000);
    });
  });

  describe('findTopByCommentCount', () => {
    it('queries known issues joined with vehicle models and comments, filtered by locale, ordered by comment count desc', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          id: 'ki-1',
          title: 'Timing chain tensioner wear',
          severity: 'high',
          vehicleBrand: 'Volkswagen',
          vehicleModel: 'Golf',
          vehicleYearFrom: '2015',
          vehicleEngine: '1.6 TDI',
          vehicleFuelType: 'diesel',
          vehicleDoors: '5',
          reportCount: '412',
        },
      ]);

      const result = await knownIssuesRepository.findTopByCommentCount(
        LookupLocale.EnGb,
        6,
      );

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('ki');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'ki.vehicleModel',
        'vm',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'comments',
        'c',
        'c.known_issue_id = ki.id AND c.deleted_at IS NULL',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('ki.deleted_at IS NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'ki.locale = :locale',
        { locale: LookupLocale.EnGb },
      );
      expect(queryBuilder.having).toHaveBeenCalledWith('COUNT(c.id) > 0');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('COUNT(c.id)', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(6);
      expect(result).toEqual([
        {
          id: 'ki-1',
          title: 'Timing chain tensioner wear',
          severity: 'high',
          reportCount: 412,
          vehicleBrand: 'Volkswagen',
          vehicleModel: 'Golf',
          vehicleYearFrom: 2015,
          vehicleEngine: '1.6 TDI',
          vehicleFuelType: 'diesel',
          vehicleDoors: 5,
        },
      ]);
    });

    it('leaves fuelType and doors as null when the vehicle model has none on record', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          id: 'ki-1',
          title: 'Timing chain tensioner wear',
          severity: 'high',
          vehicleBrand: 'Volkswagen',
          vehicleModel: 'Golf',
          vehicleYearFrom: '2015',
          vehicleEngine: '1.6 TDI',
          vehicleFuelType: null,
          vehicleDoors: null,
          reportCount: '412',
        },
      ]);

      const result = await knownIssuesRepository.findTopByCommentCount(
        LookupLocale.EnGb,
        6,
      );

      expect(result[0].vehicleFuelType).toBeNull();
      expect(result[0].vehicleDoors).toBeNull();
    });

    it('returns an empty array when there are no matches', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      const result = await knownIssuesRepository.findTopByCommentCount(
        LookupLocale.PtPt,
        6,
      );

      expect(result).toEqual([]);
    });
  });
});
