import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ActivityLogRepository,
  RawFavoriteRow,
} from './activity-log.repository';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

describe('ActivityLogRepository', () => {
  let activityLogRepository: ActivityLogRepository;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let selectQueryBuilder: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    take: jest.Mock;
    getOne: jest.Mock;
    getRawMany: jest.Mock;
  };
  let softDeleteQueryBuilder: {
    softDelete: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    selectQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getRawMany: jest.fn(),
    };
    softDeleteQueryBuilder = {
      softDelete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogRepository,
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: repository,
        },
      ],
    }).compile();

    activityLogRepository = module.get(ActivityLogRepository);
  });

  it('should be defined', () => {
    expect(activityLogRepository).toBeDefined();
  });

  describe('create', () => {
    it('delegates to repository.create', () => {
      const data = { userId: 'user-1', type: ActivityLogType.SEARCH };
      const created = { id: 'log-1', ...data } as ActivityLog;
      repository.create.mockReturnValue(created);

      const result = activityLogRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(created);
    });
  });

  describe('save', () => {
    it('delegates to repository.save', async () => {
      const activityLog = { id: 'log-1' } as ActivityLog;
      repository.save.mockResolvedValue(activityLog);

      const result = await activityLogRepository.save(activityLog);

      expect(repository.save).toHaveBeenCalledWith(activityLog);
      expect(result).toBe(activityLog);
    });
  });

  describe('findFavorite', () => {
    it('queries by userId, resourceId, type and metadata year', async () => {
      const activityLog = { id: 'log-1' } as ActivityLog;
      repository.createQueryBuilder.mockReturnValue(selectQueryBuilder);
      selectQueryBuilder.getOne.mockResolvedValue(activityLog);

      const result = await activityLogRepository.findFavorite(
        'user-1',
        'vehicle-1',
        2001,
      );

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'activity_log',
      );
      expect(selectQueryBuilder.where).toHaveBeenCalledWith(
        'activity_log.user_id = :userId',
        { userId: 'user-1' },
      );
      expect(selectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity_log.resource_id = :resourceId',
        { resourceId: 'vehicle-1' },
      );
      expect(selectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity_log.type = :type',
        { type: ActivityLogType.VEHICLE_FAVORITE },
      );
      expect(selectQueryBuilder.andWhere).toHaveBeenCalledWith(
        "activity_log.metadata->>'year' = :year",
        { year: '2001' },
      );
      expect(result).toBe(activityLog);
    });
  });

  describe('softDelete', () => {
    it('soft-deletes by userId, resourceId, type and metadata year', async () => {
      repository.createQueryBuilder.mockReturnValue(softDeleteQueryBuilder);

      await activityLogRepository.softDelete({
        userId: 'user-1',
        resourceId: 'vehicle-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
        year: 2001,
      });

      expect(softDeleteQueryBuilder.where).toHaveBeenCalledWith(
        'user_id = :userId',
        { userId: 'user-1' },
      );
      expect(softDeleteQueryBuilder.andWhere).toHaveBeenCalledWith(
        'resource_id = :resourceId',
        { resourceId: 'vehicle-1' },
      );
      expect(softDeleteQueryBuilder.andWhere).toHaveBeenCalledWith(
        'type = :type',
        { type: ActivityLogType.VEHICLE_FAVORITE },
      );
      expect(softDeleteQueryBuilder.andWhere).toHaveBeenCalledWith(
        "metadata->>'year' = :year",
        { year: '2001' },
      );
      expect(softDeleteQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('countByUserAndType', () => {
    it('counts rows scoped by userId and type', async () => {
      repository.count.mockResolvedValue(4);

      const result = await activityLogRepository.countByUserAndType(
        'user-1',
        ActivityLogType.SEARCH,
      );

      expect(repository.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: ActivityLogType.SEARCH },
      });
      expect(result).toBe(4);
    });
  });

  describe('findFavoritesHydrated', () => {
    const rawRow: RawFavoriteRow = {
      id: 'log-1',
      vehicleModelId: 'vm-1',
      year: '2001',
      favoritedAt: new Date('2026-01-01'),
      brand: 'Volkswagen',
      model: 'Polo',
      engine: '1.0',
      fuelType: 'gasoline',
      doors: '3',
      imageUrl: 'https://cdn.example.com/vw-polo.webp',
    };

    it('joins vehicle_models, filters by user and type, and orders by created_at/id desc', async () => {
      repository.createQueryBuilder.mockReturnValue(selectQueryBuilder);
      selectQueryBuilder.getRawMany.mockResolvedValue([rawRow]);

      const result = await activityLogRepository.findFavoritesHydrated(
        'user-1',
        20,
      );

      expect(selectQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'vehicle_models',
        'vm',
        'vm.id = activity_log.resource_id',
      );
      expect(selectQueryBuilder.where).toHaveBeenCalledWith(
        'activity_log.user_id = :userId',
        { userId: 'user-1' },
      );
      expect(selectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'activity_log.type = :type',
        { type: ActivityLogType.VEHICLE_FAVORITE },
      );
      expect(selectQueryBuilder.orderBy).toHaveBeenCalledWith(
        'activity_log.created_at',
        'DESC',
      );
      expect(selectQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'activity_log.id',
        'DESC',
      );
      expect(selectQueryBuilder.take).toHaveBeenCalledWith(21);
      expect(result).toEqual([rawRow]);
    });

    it('applies a keyset predicate when a cursor is given', async () => {
      repository.createQueryBuilder.mockReturnValue(selectQueryBuilder);
      selectQueryBuilder.getRawMany.mockResolvedValue([]);

      await activityLogRepository.findFavoritesHydrated('user-1', 20, {
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'log-0',
      });

      expect(selectQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('activity_log.created_at'),
        expect.objectContaining({
          createdAt_cmp0: '2026-01-01T00:00:00.000Z',
          id_cmp1: 'log-0',
        }),
      );
    });
  });
});
