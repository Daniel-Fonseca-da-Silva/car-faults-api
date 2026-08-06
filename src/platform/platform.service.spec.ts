import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../comments/comments.service';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssueWithCommentCount } from '../known-issues/known-issues.repository';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { PlatformService, PlatformStats } from './platform.service';

describe('PlatformService', () => {
  let platformService: PlatformService;
  let commentsService: { countAll: jest.Mock };
  let vehicleModelsService: { countAll: jest.Mock };
  let knownIssuesService: {
    countAll: jest.Mock;
    findTopByCommentCount: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock };

  const stats: PlatformStats = {
    reportsCount: 128,
    vehiclesCount: 42,
    faultsCount: 96,
  };

  const topFaults = [
    { id: 'ki-1', commentCount: 5 },
  ] as unknown as KnownIssueWithCommentCount[];

  beforeEach(async () => {
    commentsService = {
      countAll: jest.fn().mockResolvedValue(stats.reportsCount),
    };
    vehicleModelsService = {
      countAll: jest.fn().mockResolvedValue(stats.vehiclesCount),
    };
    knownIssuesService = {
      countAll: jest.fn().mockResolvedValue(stats.faultsCount),
      findTopByCommentCount: jest.fn().mockResolvedValue(topFaults),
    };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformService,
        { provide: CommentsService, useValue: commentsService },
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: KnownIssuesService, useValue: knownIssuesService },
        { provide: CACHE_MANAGER, useValue: cache },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('300000') },
        },
      ],
    }).compile();

    platformService = module.get(PlatformService);
  });

  it('should be defined', () => {
    expect(platformService).toBeDefined();
  });

  describe('getStats', () => {
    it('returns the cached stats without hitting the counters on a cache HIT', async () => {
      cache.get.mockResolvedValue(stats);

      const result = await platformService.getStats();

      expect(cache.get).toHaveBeenCalledWith('platform:stats');
      expect(commentsService.countAll).not.toHaveBeenCalled();
      expect(vehicleModelsService.countAll).not.toHaveBeenCalled();
      expect(knownIssuesService.countAll).not.toHaveBeenCalled();
      expect(result).toBe(stats);
    });

    it('aggregates counts from all domains and caches the result on a cache MISS', async () => {
      const result = await platformService.getStats();

      expect(commentsService.countAll).toHaveBeenCalledWith();
      expect(vehicleModelsService.countAll).toHaveBeenCalledWith();
      expect(knownIssuesService.countAll).toHaveBeenCalledWith();
      expect(cache.set).toHaveBeenCalledWith('platform:stats', stats, 300000);
      expect(result).toEqual(stats);
    });

    it('falls back to aggregation when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getStats();

      expect(commentsService.countAll).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });

    it('does not fail the request when caching the aggregated stats errors', async () => {
      cache.set.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getStats();

      expect(result).toEqual(stats);
    });
  });

  describe('getTopFaults', () => {
    it('returns the cached top faults without querying on a cache HIT', async () => {
      cache.get.mockResolvedValue(topFaults);

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(cache.get).toHaveBeenCalledWith('platform:top-faults:en-GB:6');
      expect(knownIssuesService.findTopByCommentCount).not.toHaveBeenCalled();
      expect(result).toBe(topFaults);
    });

    it('queries and caches the top faults for the given locale and limit on a cache MISS', async () => {
      const result = await platformService.getTopFaults(LookupLocale.PtPt, 12);

      expect(knownIssuesService.findTopByCommentCount).toHaveBeenCalledWith(
        LookupLocale.PtPt,
        12,
      );
      expect(cache.set).toHaveBeenCalledWith(
        'platform:top-faults:pt-PT:12',
        topFaults,
        300000,
      );
      expect(result).toBe(topFaults);
    });

    it('falls back to the query when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(knownIssuesService.findTopByCommentCount).toHaveBeenCalled();
      expect(result).toBe(topFaults);
    });

    it('does not fail the request when caching the top faults errors', async () => {
      cache.set.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(result).toBe(topFaults);
    });
  });
});
