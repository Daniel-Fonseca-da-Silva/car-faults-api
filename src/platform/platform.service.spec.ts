import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { CommentsService } from '../comments/comments.service';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { TopFaultRow } from '../known-issues/known-issues.repository';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { platformFaultsCacheKey } from '../redis/redis.constants';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let platformService: PlatformService;
  let commentsService: { countAll: jest.Mock };
  let vehicleModelsService: {
    countAll: jest.Mock;
    findCatalogPaginated: jest.Mock;
  };
  let knownIssuesService: {
    countAll: jest.Mock;
    findFaultsPaginated: jest.Mock;
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
      findCatalogPaginated: jest.fn(),
    };
    knownIssuesService = {
      countAll: jest.fn().mockResolvedValue(stats.faultsCount),
      findFaultsPaginated: jest
        .fn()
        .mockResolvedValue({ items: [topFaultRow], total: 1 }),
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

  describe('getFaults', () => {
    const criteria = { locale: LookupLocale.EnGb, page: 1, limit: 9 };
    const cacheKey = platformFaultsCacheKey(criteria);
    const page = { items: [topFaultRow], total: 1 };

    it('returns the cached page without querying the repository on a cache HIT', async () => {
      cache.get.mockResolvedValue(page);

      const result = await platformService.getFaults(criteria);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(knownIssuesService.findFaultsPaginated).not.toHaveBeenCalled();
      expect(result).toEqual(page);
    });

    it('queries and caches the result on a cache MISS', async () => {
      const result = await platformService.getFaults(criteria);

      expect(knownIssuesService.findFaultsPaginated).toHaveBeenCalledWith(
        criteria,
      );
      expect(cache.set).toHaveBeenCalledWith(cacheKey, page, 300000);
      expect(result).toEqual(page);
    });

    it('uses a distinct cache key per locale, page, limit and filters', async () => {
      const otherCriteria = {
        locale: LookupLocale.PtPt,
        page: 2,
        limit: 12,
        brand: 'Volkswagen',
      };

      await platformService.getFaults(otherCriteria);

      expect(cache.get).toHaveBeenCalledWith(
        platformFaultsCacheKey(otherCriteria),
      );
    });

    it('falls back to the repository when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getFaults(criteria);

      expect(knownIssuesService.findFaultsPaginated).toHaveBeenCalled();
      expect(result).toEqual(page);
    });

    it('does not fail the request when caching the result errors', async () => {
      cache.set.mockRejectedValue(new Error('redis down'));

      const result = await platformService.getFaults(criteria);

      expect(result).toEqual(page);
    });
  });

  describe('getVehicles', () => {
    it('delegates to the vehicle models service without caching', async () => {
      const items = [{ id: 'vm-1' }] as unknown as VehicleModel[];
      vehicleModelsService.findCatalogPaginated.mockResolvedValue({
        items,
        total: 1,
      });

      const result = await platformService.getVehicles({
        page: 1,
        limit: 50,
      });

      expect(vehicleModelsService.findCatalogPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
      });
      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(result).toEqual({ items, total: 1 });
    });
  });
});
