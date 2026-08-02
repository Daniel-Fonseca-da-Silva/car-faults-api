import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { CommentsService } from '../comments/comments.service';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let platformService: PlatformService;
  let commentsService: { countAll: jest.Mock };
  let vehicleModelsService: { countAll: jest.Mock };
  let knownIssuesService: {
    countAll: jest.Mock;
    findTopByCommentCount: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock };

  const stats = {
    reportsCount: 128340,
    vehiclesCount: 8400,
    faultsCount: 34000,
  };
  const statsCacheKey = 'platform:stats';

  const topFaultRow: TopFaultRow = {
    id: 'ki-1',
    title: 'Timing chain tensioner wear',
    severity: IssueSeverity.HIGH,
    reportCount: 412,
    vehicleBrand: 'Volkswagen',
    vehicleModel: 'Golf',
    vehicleYearFrom: 2015,
    vehicleEngine: '1.6 TDI',
    vehicleFuelType: FuelType.DIESEL,
    vehicleDoors: 5,
  };

  beforeEach(async () => {
    commentsService = {
      countAll: jest.fn().mockResolvedValue(stats.reportsCount),
    };
    vehicleModelsService = {
      countAll: jest.fn().mockResolvedValue(stats.vehiclesCount),
    };
    knownIssuesService = {
      countAll: jest.fn().mockResolvedValue(stats.faultsCount),
      findTopByCommentCount: jest.fn().mockResolvedValue([topFaultRow]),
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
    it('returns the cached stats without hitting the data sources on a cache HIT', async () => {
      cache.get.mockResolvedValue(stats);

      const result = await platformService.getStats();

      expect(cache.get).toHaveBeenCalledWith(statsCacheKey);
      expect(commentsService.countAll).not.toHaveBeenCalled();
      expect(vehicleModelsService.countAll).not.toHaveBeenCalled();
      expect(knownIssuesService.countAll).not.toHaveBeenCalled();
      expect(result).toBe(stats);
    });

    it('aggregates counts from all data sources and caches the result on a cache MISS', async () => {
      const result = await platformService.getStats();

      expect(commentsService.countAll).toHaveBeenCalledWith();
      expect(vehicleModelsService.countAll).toHaveBeenCalledWith();
      expect(knownIssuesService.countAll).toHaveBeenCalledWith();
      expect(cache.set).toHaveBeenCalledWith(statsCacheKey, stats, 300000);
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
    const cacheKey = 'platform:top-faults:en-GB:6';

    it('returns the cached items without querying the repository on a cache HIT', async () => {
      cache.get.mockResolvedValue([topFaultRow]);

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(knownIssuesService.findTopByCommentCount).not.toHaveBeenCalled();
      expect(result).toEqual([topFaultRow]);
    });

    it('queries and caches the result on a cache MISS', async () => {
      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(knownIssuesService.findTopByCommentCount).toHaveBeenCalledWith(
        LookupLocale.EnGb,
        6,
      );
      expect(cache.set).toHaveBeenCalledWith(cacheKey, [topFaultRow], 300000);
      expect(result).toEqual([topFaultRow]);
    });

    it('uses a distinct cache key per locale and limit', async () => {
      await platformService.getTopFaults(LookupLocale.PtPt, 12);

      expect(cache.get).toHaveBeenCalledWith('platform:top-faults:pt-PT:12');
    });

    it('falls back to the repository when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(knownIssuesService.findTopByCommentCount).toHaveBeenCalled();
      expect(result).toEqual([topFaultRow]);
    });

    it('does not fail the request when caching the result errors', async () => {
      cache.set.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getTopFaults(LookupLocale.EnGb, 6);

      expect(result).toEqual([topFaultRow]);
    });
  });
});
