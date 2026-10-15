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
    findLocalesByVehicleModelIds: jest.Mock;
    findIssuesUpdatedAtByVehicleModelIds: jest.Mock;
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
    contentLocale: LookupLocale.EnGb,
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
        .mockResolvedValue({ items: [topFaultRow], nextCursor: null }),
      findLocalesByVehicleModelIds: jest.fn().mockResolvedValue(new Map()),
      findIssuesUpdatedAtByVehicleModelIds: jest
        .fn()
        .mockResolvedValue(new Map()),
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
    const criteria = { locale: LookupLocale.EnGb, limit: 9 };
    const cacheKey = platformFaultsCacheKey(criteria);
    const page = { items: [topFaultRow], nextCursor: null };

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

    it('uses a distinct cache key per locale, cursor, limit and filters', async () => {
      const otherCriteria = {
        locale: LookupLocale.PtPt,
        cursor: 'abc',
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
    const criteria = { limit: 50, cursor: 'abc' };
    const vehicleModels = [
      { id: 'vm-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'vm-2', updatedAt: new Date('2026-05-01T00:00:00.000Z') },
    ] as VehicleModel[];
    const catalogPage = { items: vehicleModels, nextCursor: 'next' };
    const page = {
      items: [
        {
          vehicleModel: vehicleModels[0],
          locales: [LookupLocale.PtPt],
          // Issue change is newer than the vehicle model change.
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
        {
          vehicleModel: vehicleModels[1],
          locales: [],
          // Vehicle model change is newer than the issue change.
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
      nextCursor: 'next',
    };

    beforeEach(() => {
      vehicleModelsService.findCatalogPaginated.mockResolvedValue(catalogPage);
      knownIssuesService.findLocalesByVehicleModelIds.mockResolvedValue(
        new Map([['vm-1', [LookupLocale.PtPt]]]),
      );
      knownIssuesService.findIssuesUpdatedAtByVehicleModelIds.mockResolvedValue(
        new Map([
          ['vm-1', new Date('2026-03-01T00:00:00.000Z')],
          ['vm-2', new Date('2026-02-01T00:00:00.000Z')],
        ]),
      );
    });

    it('returns the cached page without querying the catalog on a cache HIT', async () => {
      cache.get.mockResolvedValue(page);

      const result = await platformService.getVehicles(criteria);

      expect(cache.get).toHaveBeenCalledWith('platform:vehicles:v3:50:abc');
      expect(vehicleModelsService.findCatalogPaginated).not.toHaveBeenCalled();
      expect(
        knownIssuesService.findLocalesByVehicleModelIds,
      ).not.toHaveBeenCalled();
      expect(result).toBe(page);
    });

    it('attaches each vehicle model locales and latest update and caches the page on a cache MISS', async () => {
      cache.get.mockResolvedValue(undefined);

      const result = await platformService.getVehicles(criteria);

      expect(vehicleModelsService.findCatalogPaginated).toHaveBeenCalledWith(
        criteria,
      );
      expect(
        knownIssuesService.findLocalesByVehicleModelIds,
      ).toHaveBeenCalledWith(['vm-1', 'vm-2']);
      expect(
        knownIssuesService.findIssuesUpdatedAtByVehicleModelIds,
      ).toHaveBeenCalledWith(['vm-1', 'vm-2']);
      expect(result).toEqual(page);
      expect(cache.set).toHaveBeenCalledWith(
        'platform:vehicles:v3:50:abc',
        page,
        300000,
      );
    });

    it('uses an empty cursor segment for the first page', async () => {
      cache.get.mockResolvedValue(page);

      await platformService.getVehicles({ limit: 200 });

      expect(cache.get).toHaveBeenCalledWith('platform:vehicles:v3:200:');
    });

    it('falls back to the catalog query when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis down'));

      await expect(platformService.getVehicles(criteria)).resolves.toEqual(
        page,
      );
    });

    it('does not fail the request when caching the page errors', async () => {
      cache.get.mockResolvedValue(undefined);
      cache.set.mockRejectedValue(new Error('redis down'));

      await expect(platformService.getVehicles(criteria)).resolves.toEqual(
        page,
      );
    });
  });
});
