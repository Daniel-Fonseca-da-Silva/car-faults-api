import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

describe('ActivityLogRepository', () => {
  let activityLogRepository: ActivityLogRepository;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
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
    it('queries by userId, resourceId and the vehicle_favorite type', async () => {
      const activityLog = { id: 'log-1' } as ActivityLog;
      repository.findOne.mockResolvedValue(activityLog);

      const result = await activityLogRepository.findFavorite(
        'user-1',
        'vehicle-1',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          resourceId: 'vehicle-1',
          type: ActivityLogType.VEHICLE_FAVORITE,
        },
      });
      expect(result).toBe(activityLog);
    });
  });

  describe('softDelete', () => {
    it('soft-deletes by userId, resourceId and type', async () => {
      repository.softDelete.mockResolvedValue(undefined);

      await activityLogRepository.softDelete({
        userId: 'user-1',
        resourceId: 'vehicle-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
      });

      expect(repository.softDelete).toHaveBeenCalledWith({
        userId: 'user-1',
        resourceId: 'vehicle-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
      });
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
});
