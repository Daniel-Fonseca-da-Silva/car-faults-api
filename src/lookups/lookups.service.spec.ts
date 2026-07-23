import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { AI_LOOKUP_PROVIDER, AiLookupResult } from '../ai/ai-lookup.provider';
import { Fix } from '../fixes/entities/fix.entity';
import { FixSource } from '../fixes/enums/fix-source.enum';
import { FixesService } from '../fixes/fixes.service';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupsService } from './lookups.service';

describe('LookupsService', () => {
  let lookupsService: LookupsService;
  let vehicleModelsService: {
    findByLookup: jest.Mock;
    create: jest.Mock;
  };
  let knownIssuesService: {
    findByVehicleModelId: jest.Mock;
    saveMany: jest.Mock;
  };
  let fixesService: { saveMany: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let aiLookupProvider: { generateLookup: jest.Mock };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
  };

  const query: LookupQueryDto = {
    brand: ' Volkswagen ',
    model: ' Polo ',
    year: 2001,
    engine: ' 1.0 ',
  };
  const normalizedCriteria = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
  };
  const cacheKey = 'vehicle:lookup:Volkswagen:Polo:2001:1.0';

  beforeEach(async () => {
    vehicleModelsService = {
      findByLookup: jest.fn(),
      create: jest.fn(),
    };
    knownIssuesService = {
      findByVehicleModelId: jest.fn(),
      saveMany: jest.fn(),
    };
    fixesService = { saveMany: jest.fn() };
    dataSource = { transaction: jest.fn() };
    aiLookupProvider = { generateLookup: jest.fn() };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookupsService,
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: KnownIssuesService, useValue: knownIssuesService },
        { provide: FixesService, useValue: fixesService },
        { provide: DataSource, useValue: dataSource },
        { provide: AI_LOOKUP_PROVIDER, useValue: aiLookupProvider },
        { provide: CACHE_MANAGER, useValue: cache },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('21600000') },
        },
      ],
    }).compile();

    lookupsService = module.get(LookupsService);
  });

  it('should be defined', () => {
    expect(lookupsService).toBeDefined();
  });

  describe('lookup', () => {
    it('returns the cached result without hitting Postgres or the AI provider on a cache HIT', async () => {
      const cached = {
        vehicle: { id: 'vm-1' },
        knownIssues: [],
      };
      cache.get.mockResolvedValue(cached);

      const result = await lookupsService.lookup(query);

      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(vehicleModelsService.findByLookup).not.toHaveBeenCalled();
      expect(aiLookupProvider.generateLookup).not.toHaveBeenCalled();
      expect(result).toBe(cached);
    });

    it('returns a Postgres HIT without calling the AI provider, and caches the result', async () => {
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      const knownIssues = [
        { id: 'ki-1', fixes: [] },
      ] as unknown as KnownIssue[];
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelId.mockResolvedValue(knownIssues);

      const result = await lookupsService.lookup(query);

      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith(
        normalizedCriteria,
      );
      expect(knownIssuesService.findByVehicleModelId).toHaveBeenCalledWith(
        'vm-1',
      );
      expect(aiLookupProvider.generateLookup).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(result.vehicle.id).toBe('vm-1');
      expect(result.knownIssues).toHaveLength(1);
      expect(cache.set).toHaveBeenCalledWith(cacheKey, result, 21600000);
    });

    it('falls back to Postgres when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis unavailable'));
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([]);

      const result = await lookupsService.lookup(query);

      expect(vehicleModelsService.findByLookup).toHaveBeenCalled();
      expect(result.vehicle.id).toBe('vm-1');
    });

    it('does not fail the request when caching the result errors', async () => {
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([]);
      cache.set.mockRejectedValue(new Error('redis unavailable'));

      const result = await lookupsService.lookup(query);

      expect(result.vehicle.id).toBe('vm-1');
    });

    it('on a Postgres MISS, calls the AI provider and persists the result in a transaction', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);

      const aiResult: AiLookupResult = {
        vehicle: { ...normalizedCriteria, doors: 3, techSpecs: { hp: 50 } },
        knownIssues: [
          {
            title: 'Gearbox',
            description: 'Wears out',
            severity: IssueSeverity.HIGH,
            typicalKm: 120000,
            sources: ['https://example.com'],
            fixes: [
              {
                summary: 'Replace synchros',
                steps: 'Do it',
                estimatedCostEur: 450,
              },
              { summary: 'Adjust clutch', steps: 'Do it too' },
            ],
          },
          {
            title: 'Rust',
            description: 'Wheel arches',
            severity: IssueSeverity.MEDIUM,
            fixes: [],
          },
        ],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      const manager = {} as EntityManager;
      const savedVehicleModel = { id: 'vm-1' } as VehicleModel;
      const savedKnownIssues = [{ id: 'ki-1' }, { id: 'ki-2' }] as KnownIssue[];
      const savedFixes = [
        { id: 'fix-1', knownIssueId: 'ki-1' },
        { id: 'fix-2', knownIssueId: 'ki-1' },
      ] as Fix[];

      vehicleModelsService.create.mockResolvedValue(savedVehicleModel);
      knownIssuesService.saveMany.mockResolvedValue(savedKnownIssues);
      fixesService.saveMany.mockResolvedValue(savedFixes);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      const result = await lookupsService.lookup(query);

      expect(aiLookupProvider.generateLookup).toHaveBeenCalledWith(
        normalizedCriteria,
      );
      expect(vehicleModelsService.create).toHaveBeenCalledWith(
        {
          brand: 'Volkswagen',
          model: 'Polo',
          yearFrom: 2001,
          yearTo: 2001,
          engine: '1.0',
          doors: 3,
          techSpecs: { hp: 50 },
        },
        manager,
      );
      expect(knownIssuesService.saveMany).toHaveBeenCalledWith(
        [
          {
            vehicleModelId: 'vm-1',
            title: 'Gearbox',
            description: 'Wears out',
            severity: IssueSeverity.HIGH,
            typicalKm: 120000,
            sources: ['https://example.com'],
            aiGeneratedAt: expect.any(Date) as Date,
          },
          {
            vehicleModelId: 'vm-1',
            title: 'Rust',
            description: 'Wheel arches',
            severity: IssueSeverity.MEDIUM,
            typicalKm: null,
            sources: null,
            aiGeneratedAt: expect.any(Date) as Date,
          },
        ],
        manager,
      );
      expect(fixesService.saveMany).toHaveBeenCalledWith(
        [
          {
            knownIssueId: 'ki-1',
            userId: null,
            summary: 'Replace synchros',
            steps: 'Do it',
            estimatedCostEur: '450',
            source: FixSource.AI,
          },
          {
            knownIssueId: 'ki-1',
            userId: null,
            summary: 'Adjust clutch',
            steps: 'Do it too',
            estimatedCostEur: null,
            source: FixSource.AI,
          },
        ],
        manager,
      );
      expect(result.vehicle.id).toBe('vm-1');
      expect(result.knownIssues).toHaveLength(2);
      expect(result.knownIssues[0].fixes).toHaveLength(2);
      expect(result.knownIssues[1].fixes).toHaveLength(0);
    });

    it('skips fixesService.saveMany when the AI result has no fixes at all', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: normalizedCriteria,
        knownIssues: [
          {
            title: 'Rust',
            description: 'Wheel arches',
            severity: IssueSeverity.LOW,
            fixes: [],
          },
        ],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      const manager = {} as EntityManager;
      vehicleModelsService.create.mockResolvedValue({
        id: 'vm-1',
      });
      knownIssuesService.saveMany.mockResolvedValue([
        { id: 'ki-1' },
      ] as KnownIssue[]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      const result = await lookupsService.lookup(query);

      expect(fixesService.saveMany).not.toHaveBeenCalled();
      expect(result.knownIssues[0].fixes).toEqual([]);
    });

    it('includes doors in the cache key and lookup criteria when present in the query', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([]);

      const result = await lookupsService.lookup({ ...query, doors: 3 });

      const doorsCacheKey = 'vehicle:lookup:Volkswagen:Polo:2001:1.0:3';
      expect(cache.get).toHaveBeenCalledWith(doorsCacheKey);
      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        ...normalizedCriteria,
        doors: 3,
      });
      expect(cache.set).toHaveBeenCalledWith(doorsCacheKey, result, 21600000);
    });

    it('does not mix doors and no-doors cache entries', async () => {
      cache.get.mockResolvedValue(undefined);
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: normalizedCriteria,
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);
      const manager = {} as EntityManager;
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup({ ...query, doors: 5 });

      expect(cache.get).toHaveBeenCalledWith(
        'vehicle:lookup:Volkswagen:Polo:2001:1.0:5',
      );
    });

    it('prioritizes doors from the query over the AI result when persisting', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: { ...normalizedCriteria, doors: 5 },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      const manager = {} as EntityManager;
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup({ ...query, doors: 3 });

      expect(vehicleModelsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ doors: 3 }),
        manager,
      );
    });

    it('falls back to the AI result doors when the query has none', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: { ...normalizedCriteria, doors: 5 },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      const manager = {} as EntityManager;
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query);

      expect(vehicleModelsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ doors: 5 }),
        manager,
      );
    });
  });
});
