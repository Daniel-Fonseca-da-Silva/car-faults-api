import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityLogType } from '../activity-log/enums/activity-log-type.enum';
import { FixVoteValue } from '../fixes/enums/fix-vote-value.enum';
import { FixesService } from '../fixes/fixes.service';
import { UserVehiclesService } from '../user-vehicles/user-vehicles.service';
import { UserStats, UserStatsService } from './user-stats.service';

describe('UserStatsService', () => {
  let userStatsService: UserStatsService;
  let activityLogService: { countByUserAndType: jest.Mock };
  let userVehiclesService: { countByUser: jest.Mock };
  let fixesService: { countVotesByUser: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock };

  const userId = 'user-1';
  const cacheKey = 'user:stats:user-1';

  const stats: UserStats = {
    searchesCount: 4,
    defectsConsultedCount: 2,
    savedVehiclesCount: 3,
    votesCount: 5,
    dislikesCount: 1,
    favoritedVehiclesCount: 2,
  };

  beforeEach(async () => {
    activityLogService = { countByUserAndType: jest.fn() };
    userVehiclesService = { countByUser: jest.fn() };
    fixesService = { countVotesByUser: jest.fn() };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatsService,
        { provide: ActivityLogService, useValue: activityLogService },
        { provide: UserVehiclesService, useValue: userVehiclesService },
        { provide: FixesService, useValue: fixesService },
        { provide: CACHE_MANAGER, useValue: cache },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('60000') },
        },
      ],
    }).compile();

    userStatsService = module.get(UserStatsService);

    activityLogService.countByUserAndType.mockImplementation(
      (_userId: string, type: ActivityLogType) => {
        if (type === ActivityLogType.SEARCH) {
          return Promise.resolve(stats.searchesCount);
        }
        if (type === ActivityLogType.DEFECT_CONSULTED) {
          return Promise.resolve(stats.defectsConsultedCount);
        }
        return Promise.resolve(stats.favoritedVehiclesCount);
      },
    );
    userVehiclesService.countByUser.mockResolvedValue(stats.savedVehiclesCount);
    fixesService.countVotesByUser.mockImplementation(
      (_userId: string, value: FixVoteValue) =>
        Promise.resolve(
          value === FixVoteValue.LIKE ? stats.votesCount : stats.dislikesCount,
        ),
    );
  });

  it('should be defined', () => {
    expect(userStatsService).toBeDefined();
  });

  describe('getStats', () => {
    it('returns the cached stats without hitting the data sources on a cache HIT', async () => {
      cache.get.mockResolvedValue(stats);

      const result = await userStatsService.getStats(userId);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(activityLogService.countByUserAndType).not.toHaveBeenCalled();
      expect(userVehiclesService.countByUser).not.toHaveBeenCalled();
      expect(fixesService.countVotesByUser).not.toHaveBeenCalled();
      expect(result).toBe(stats);
    });

    it('aggregates counts from all data sources and caches the result on a cache MISS', async () => {
      const result = await userStatsService.getStats(userId);

      expect(activityLogService.countByUserAndType).toHaveBeenCalledWith(
        userId,
        ActivityLogType.SEARCH,
      );
      expect(activityLogService.countByUserAndType).toHaveBeenCalledWith(
        userId,
        ActivityLogType.DEFECT_CONSULTED,
      );
      expect(activityLogService.countByUserAndType).toHaveBeenCalledWith(
        userId,
        ActivityLogType.VEHICLE_FAVORITE,
      );
      expect(userVehiclesService.countByUser).toHaveBeenCalledWith(userId);
      expect(fixesService.countVotesByUser).toHaveBeenCalledWith(
        userId,
        FixVoteValue.LIKE,
      );
      expect(fixesService.countVotesByUser).toHaveBeenCalledWith(
        userId,
        FixVoteValue.DISLIKE,
      );
      expect(cache.set).toHaveBeenCalledWith(cacheKey, stats, 60000);
      expect(result).toEqual(stats);
    });

    it('falls back to aggregation when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      const result = await userStatsService.getStats(userId);

      expect(userVehiclesService.countByUser).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });

    it('does not fail the request when caching the aggregated stats errors', async () => {
      cache.set.mockRejectedValue(new Error('redis down'));

      const result = await userStatsService.getStats(userId);

      expect(result).toEqual(stats);
    });
  });
});
