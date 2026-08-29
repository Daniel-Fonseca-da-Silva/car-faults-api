import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';

describe('KnownIssuesRepository', () => {
  let knownIssuesRepository: KnownIssuesRepository;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    innerJoin: jest.Mock;
    leftJoin: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    having: jest.Mock;
    andHaving: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    limit: jest.Mock;
    take: jest.Mock;
    getRawMany: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      andHaving: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
    };
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
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

  describe('findPageByVehicleModelId', () => {
    it('filters by vehicle model and orders by created_at/id desc, without joining fixes', async () => {
      const knownIssues = [{ id: 'ki-1' }] as KnownIssue[];
      queryBuilder.getMany.mockResolvedValue(knownIssues);

      const result = await knownIssuesRepository.findPageByVehicleModelId(
        'vm-1',
        20,
      );

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('known_issue');
      expect(queryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'known_issue.vehicle_model_id = :vehicleModelId',
        { vehicleModelId: 'vm-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'known_issue.created_at',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'known_issue.id',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(21);
      expect(result).toBe(knownIssues);
    });

    it('applies a keyset predicate when a cursor is given', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await knownIssuesRepository.findPageByVehicleModelId('vm-1', 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'ki-0',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('known_issue.created_at'),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'ki-0',
        }),
      );
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

  describe('findByIdWithFixes', () => {
    it('delegates to repository.findOne with the fixes relation', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      repository.findOne.mockResolvedValue(knownIssue);

      const result = await knownIssuesRepository.findByIdWithFixes('ki-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'ki-1' },
        relations: { fixes: true },
      });
      expect(result).toBe(knownIssue);
    });
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { title: 'Gearbox' };
      const knownIssue = { ...data } as KnownIssue;
      repository.create.mockReturnValue(knownIssue);

      const result = knownIssuesRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(knownIssue);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const knownIssue = { id: 'ki-1' } as KnownIssue;
      repository.save.mockResolvedValue(knownIssue);

      const result = await knownIssuesRepository.save(knownIssue);

      expect(repository.save).toHaveBeenCalledWith(knownIssue);
      expect(result).toBe(knownIssue);
    });
  });

  describe('softDelete', () => {
    it('delegates to repository.softDelete', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await knownIssuesRepository.softDelete('ki-1');

      expect(repository.softDelete).toHaveBeenCalledWith('ki-1');
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

  describe('findFaultsPaginated', () => {
    const rawRow = {
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
    };

    it('queries known issues joined with vehicle models and comments, filtered by locale, ordered by comment count/id desc and limited by limit+1', async () => {
      queryBuilder.getRawMany.mockResolvedValue([rawRow]);

      const result = await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.EnGb,
        limit: 9,
      });

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
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('ki.id', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(queryBuilder.andHaving).not.toHaveBeenCalled();
      expect(result).toEqual({
        nextCursor: null,
        items: [
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
        ],
      });
    });

    it('applies a keyset predicate via andHaving when a cursor is given', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);
      const cursor = Buffer.from(
        JSON.stringify({ reportCount: 100, id: 'ki-0' }),
        'utf8',
      ).toString('base64url');

      await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.EnGb,
        limit: 9,
        cursor,
      });

      expect(queryBuilder.andHaving).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(c.id)'),
        expect.objectContaining({
          reportCount_cmp0: 100,
          id_cmp1: 'ki-0',
        }),
      );
    });

    it('returns an encoded nextCursor when there is a lookahead row', async () => {
      const secondRow = { ...rawRow, id: 'ki-2', reportCount: '100' };
      queryBuilder.getRawMany.mockResolvedValue([rawRow, secondRow]);

      const result = await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.EnGb,
        limit: 1,
      });

      expect(queryBuilder.limit).toHaveBeenCalledWith(2);
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).not.toBeNull();
    });

    it('applies brand, model, engine, fuelType, doors and year filters', async () => {
      queryBuilder.getRawMany.mockResolvedValue([rawRow]);

      await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.EnGb,
        limit: 9,
        brand: 'Volks',
        model: 'Gol',
        engine: 'TDI',
        fuelType: FuelType.DIESEL,
        doors: 5,
        year: 2018,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'vm.brand ILIKE :brand',
        { brand: '%Volks%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'vm.model ILIKE :model',
        { model: '%Gol%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'vm.engine ILIKE :engine',
        { engine: '%TDI%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'vm.fuel_type = :fuelType',
        { fuelType: FuelType.DIESEL },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('vm.doors = :doors', {
        doors: 5,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'vm.year_from <= :year',
        { year: 2018 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(vm.year_to IS NULL OR vm.year_to >= :year)',
        { year: 2018 },
      );
    });

    it('leaves fuelType and doors as null when the vehicle model has none on record', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { ...rawRow, vehicleFuelType: null, vehicleDoors: null },
      ]);

      const result = await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.EnGb,
        limit: 9,
      });

      expect(result.items[0].vehicleFuelType).toBeNull();
      expect(result.items[0].vehicleDoors).toBeNull();
    });

    it('returns an empty page when there are no matches', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      const result = await knownIssuesRepository.findFaultsPaginated({
        locale: LookupLocale.PtPt,
        limit: 9,
      });

      expect(result).toEqual({ nextCursor: null, items: [] });
    });
  });
});
