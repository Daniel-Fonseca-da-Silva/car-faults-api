import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { encodeCursor } from '../common/pagination/cursor.util';
import {
  ActivityLogRepository,
  RawFavoriteRow,
} from './activity-log.repository';
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
    findFavoritesHydrated: jest.Mock;
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
      findFavoritesHydrated: jest.fn(),
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
    it('throws BadRequestException when year is not given', async () => {
      await expect(
        activityLogService.favoriteVehicle(userId, 'vm-1', undefined),
      ).rejects.toThrow(BadRequestException);
      expect(activityLogRepository.findFavorite).not.toHaveBeenCalled();
    });

    it('returns the existing favorite without creating a duplicate', async () => {
      const existing = { id: 'log-1' } as ActivityLog;
      activityLogRepository.findFavorite.mockResolvedValue(existing);

      const result = await activityLogService.favoriteVehicle(
        userId,
        'vm-1',
        2001,
      );

      expect(activityLogRepository.findFavorite).toHaveBeenCalledWith(
        userId,
        'vm-1',
        2001,
      );
      expect(activityLogRepository.create).not.toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('creates a new favorite with the year in metadata and evicts the stats cache when none exists', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);
      const created = {
        id: 'log-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
        metadata: { year: 2001 },
      } as unknown as ActivityLog;
      activityLogRepository.create.mockReturnValue(created);
      activityLogRepository.save.mockResolvedValue(created);

      const result = await activityLogService.favoriteVehicle(
        userId,
        'vm-1',
        2001,
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId,
        type: ActivityLogType.VEHICLE_FAVORITE,
        resourceId: 'vm-1',
        metadata: { year: 2001 },
      });
      expect(cache.del).toHaveBeenCalledWith('user:stats:user-1');
      expect(result).toBe(created);
    });
  });

  describe('unfavoriteVehicle', () => {
    it('throws NotFoundException when the favorite does not exist', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);

      await expect(
        activityLogService.unfavoriteVehicle(userId, 'vm-1', 2001),
      ).rejects.toThrow(NotFoundException);
      expect(activityLogRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deletes the favorite and evicts the stats cache', async () => {
      activityLogRepository.findFavorite.mockResolvedValue({
        id: 'log-1',
      });

      await activityLogService.unfavoriteVehicle(userId, 'vm-1', 2001);

      expect(activityLogRepository.softDelete).toHaveBeenCalledWith({
        userId,
        resourceId: 'vm-1',
        type: ActivityLogType.VEHICLE_FAVORITE,
        year: 2001,
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

  describe('isFavorited', () => {
    it('returns true when a favorite exists', async () => {
      activityLogRepository.findFavorite.mockResolvedValue({ id: 'log-1' });

      await expect(
        activityLogService.isFavorited(userId, 'vm-1', 2001),
      ).resolves.toBe(true);
      expect(activityLogRepository.findFavorite).toHaveBeenCalledWith(
        userId,
        'vm-1',
        2001,
      );
    });

    it('returns false when no favorite exists', async () => {
      activityLogRepository.findFavorite.mockResolvedValue(null);

      await expect(
        activityLogService.isFavorited(userId, 'vm-1', 2001),
      ).resolves.toBe(false);
    });
  });

  describe('findFavorites', () => {
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

    it('maps hydrated rows and returns a null nextCursor when there is no next page', async () => {
      activityLogRepository.findFavoritesHydrated.mockResolvedValue([rawRow]);

      const result = await activityLogService.findFavorites(userId, {});

      expect(activityLogRepository.findFavoritesHydrated).toHaveBeenCalledWith(
        userId,
        20,
        undefined,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'log-1',
        vehicleModelId: 'vm-1',
        year: 2001,
        brand: 'Volkswagen',
      });
      expect(result.nextCursor).toBeNull();
    });

    it('returns an encoded nextCursor when the repository reports a lookahead row', async () => {
      const secondRow: RawFavoriteRow = {
        ...rawRow,
        id: 'log-2',
        favoritedAt: new Date('2026-01-02'),
      };
      activityLogRepository.findFavoritesHydrated.mockResolvedValue([
        secondRow,
        rawRow,
      ]);

      const result = await activityLogService.findFavorites(userId, {
        limit: 1,
      });

      expect(activityLogRepository.findFavoritesHydrated).toHaveBeenCalledWith(
        userId,
        1,
        undefined,
      );
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).not.toBeNull();
    });

    it('decodes the given cursor and passes it to the repository', async () => {
      activityLogRepository.findFavoritesHydrated.mockResolvedValue([]);
      const cursor = encodeCursor({
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'log-0',
      });

      await activityLogService.findFavorites(userId, { cursor });

      expect(activityLogRepository.findFavoritesHydrated).toHaveBeenCalledWith(
        userId,
        20,
        { createdAt: '2026-01-01T00:00:00.000Z', id: 'log-0' },
      );
    });

    it('clamps limit to the maximum', async () => {
      activityLogRepository.findFavoritesHydrated.mockResolvedValue([]);

      await activityLogService.findFavorites(userId, { limit: 500 });

      expect(activityLogRepository.findFavoritesHydrated).toHaveBeenCalledWith(
        userId,
        100,
        undefined,
      );
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
        activityLogService.favoriteVehicle(userId, 'vm-1', 2001),
      ).resolves.toBe(created);
    });
  });
});
