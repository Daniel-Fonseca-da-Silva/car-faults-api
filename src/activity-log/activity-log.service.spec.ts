import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogType } from './enums/activity-log-type.enum';

describe('ActivityLogService', () => {
  let activityLogService: ActivityLogService;
  let activityLogRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findFavorite: jest.Mock;
    softDelete: jest.Mock;
    countByUserAndType: jest.Mock;
  };
  let cache: { del: jest.Mock };

  const userId = 'user-1';

  beforeEach(async () => {
    activityLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findFavorite: jest.fn(),
      softDelete: jest.fn(),
      countByUserAndType: jest.fn(),
    };
    cache = { del: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        { provide: ActivityLogRepository, useValue: activityLogRepository },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    activityLogService = module.get(ActivityLogService);
  });

  it('should be defined', () => {
    expect(activityLogService).toBeDefined();
  });

  describe('recordSearch', () => {
    it('creates a search activity log and evicts the stats cache', async () => {
      const metadata = { brand: 'Volkswagen', model: 'Polo' };
      const created = { id: 'log-1' } as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);

      await activityLogService.recordSearch(userId, metadata);

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId,
        type: ActivityLogType.SEARCH,
        metadata,
      });
      expect(activityLogRepository.save).toHaveBeenCalledWith(created);
      expect(cache.del).toHaveBeenCalledWith('user:stats:user-1');
    });

    it('swallows repository errors and never throws', async () => {
      activityLogRepository.create.mockImplementation(() => {
        throw new Error('db down');
      });

      await expect(
        activityLogService.recordSearch(userId, {}),
      ).resolves.toBeUndefined();
    });

    it('swallows cache eviction failures without throwing', async () => {
      const created = { id: 'log-1' } as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);
      cache.del.mockRejectedValue(new Error('redis down'));

      await expect(
        activityLogService.recordSearch(userId, {}),
      ).resolves.toBeUndefined();
    });
  });

  describe('recordDefectConsulted', () => {
    it('creates a defect_consulted activity log and evicts the stats cache', async () => {
      const created = {
        id: 'log-1',
        type: ActivityLogType.DEFECT_CONSULTED,
        resourceId: 'ki-1',
      } as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);

      const result = await activityLogService.recordDefectConsulted(
        userId,
        'ki-1',
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId,
        type: ActivityLogType.DEFECT_CONSULTED,
        resourceId: 'ki-1',
      });
      expect(cache.del).toHaveBeenCalledWith('user:stats:user-1');
      expect(result).toBe(created);
    });
  });

  describe('favoriteVehicle', () => {
    it('returns the existing favorite without creating a duplicate', async () => {
      const existing = { id: 'log-1' } as ActivityLog;
      activityLogRepository.findFavorite.mockResolvedValue(existing);

      const result = await activityLogService.favoriteVehicle(userId, 'vm-1');

      expect(activityLogRepository.create).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('creates a new favorite and evicts the stats cache when none exists', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);
      const created = {
        id: 'log-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
      } as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);

      const result = await activityLogService.favoriteVehicle(userId, 'vm-1');

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId,
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
      });
      expect(cache.del).toHaveBeenCalledWith('user:stats:user-1');
      expect(result).toBe(created);
    });
  });

  describe('unfavoriteVehicle', () => {
    it('throws NotFoundException when the favorite does not exist', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);

      await expect(
        activityLogService.unfavoriteVehicle(userId, 'vm-1'),
      ).rejects.toThrow(NotFoundException);
      expect(activityLogRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deletes the favorite and evicts the stats cache', async () => {
      activityLogRepository.findFavorite.mockResolvedValue({
        id: 'log-1',
      });

      await activityLogService.unfavoriteVehicle(userId, 'vm-1');

      expect(activityLogRepository.softDelete).toHaveBeenCalledWith({
        userId,
        resourceId: 'vm-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
      });
      expect(cache.del).toHaveBeenCalledWith('user:stats:user-1');
    });
  });

  describe('countByUserAndType', () => {
    it('delegates to the repository', async () => {
      activityLogRepository.countByUserAndType.mockResolvedValue(7);

      const result = await activityLogService.countByUserAndType(
        userId,
        ActivityLogType.SEARCH,
      );

      expect(activityLogRepository.countByUserAndType).toHaveBeenCalledWith(
        userId,
        ActivityLogType.SEARCH,
      );
      expect(result).toBe(7);
    });
  });

  describe('cache eviction failure handling', () => {
    it('logs a warning and does not throw when cache deletion fails on a write path', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);
      const created = { id: 'log-1' } as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);
      cache.del.mockRejectedValue(new Error('redis down'));

      await expect(
        activityLogService.favoriteVehicle(userId, 'vm-1'),
      ).resolves.toBe(created);
    });
  });
});
