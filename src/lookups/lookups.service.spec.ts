import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { AI_LOOKUP_PROVIDER, AiLookupResult } from '../ai/ai-lookup.provider';
import { AI_TRANSLATE_PROVIDER } from '../ai/ai-translate.provider';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { Fix } from '../fixes/entities/fix.entity';
import { FixSource } from '../fixes/enums/fix-source.enum';
import { FixesService } from '../fixes/fixes.service';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { TurnstileService } from '../turnstile/turnstile.service';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
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
    findByVehicleModelIdAndLocale: jest.Mock;
    saveMany: jest.Mock;
  };
  let fixesService: { saveMany: jest.Mock; findByKnownIssue: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let aiLookupProvider: { generateLookup: jest.Mock };
  let aiTranslateProvider: { translate: jest.Mock };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let turnstileService: { assertValid: jest.Mock };

  const query: LookupQueryDto = {
    brand: ' Volkswagen ',
    model: ' Polo ',
    year: 2001,
    engine: ' 1.0 ',
    fuelType: FuelType.DIESEL,
  };
  const normalizedCriteria = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    fuelType: FuelType.DIESEL,
    language: LookupLocale.EnGb,
  };
  const cacheKey = 'vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel:en-GB';
  const aiVehicleResult = {
    brand: 'Volkswagen',
    model: 'Polo',
    year: 2001,
    engine: '1.0',
    fuelType: FuelType.DIESEL,
    name: 'Volkswagen Polo',
  };

  const manager = {} as EntityManager;

  beforeEach(async () => {
    vehicleModelsService = {
      findByLookup: jest.fn(),
      create: jest.fn(),
    };
    knownIssuesService = {
      findByVehicleModelId: jest.fn(),
      findByVehicleModelIdAndLocale: jest.fn(),
      saveMany: jest.fn(),
    };
    fixesService = {
      saveMany: jest.fn(),
      findByKnownIssue: jest.fn().mockResolvedValue([]),
    };
    dataSource = { transaction: jest.fn() };
    aiLookupProvider = { generateLookup: jest.fn() };
    aiTranslateProvider = { translate: jest.fn() };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };
    turnstileService = { assertValid: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookupsService,
        { provide: VehicleModelsService, useValue: vehicleModelsService },
        { provide: KnownIssuesService, useValue: knownIssuesService },
        { provide: FixesService, useValue: fixesService },
        { provide: DataSource, useValue: dataSource },
        { provide: AI_LOOKUP_PROVIDER, useValue: aiLookupProvider },
        { provide: AI_TRANSLATE_PROVIDER, useValue: aiTranslateProvider },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: TurnstileService, useValue: turnstileService },
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

    it('returns a Postgres HIT for the requested locale without calling the AI provider, and caches the result', async () => {
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      const knownIssues = [
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ] as unknown as KnownIssue[];
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue(
        knownIssues,
      );
      const fixWithCounts = {
        id: 'fix-1',
        summary: 'Replace synchros',
        likes: 5,
        dislikes: 1,
      } as unknown as Fix;
      fixesService.findByKnownIssue.mockResolvedValue([fixWithCounts]);

      const result = await lookupsService.lookup(query);

      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith(
        normalizedCriteria,
      );
      expect(
        knownIssuesService.findByVehicleModelIdAndLocale,
      ).toHaveBeenCalledWith('vm-1', LookupLocale.EnGb);
      expect(fixesService.findByKnownIssue).toHaveBeenCalledWith('ki-1');
      expect(aiLookupProvider.generateLookup).not.toHaveBeenCalled();
      expect(aiTranslateProvider.translate).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(result.vehicle.id).toBe('vm-1');
      expect(result.knownIssues).toHaveLength(1);
      expect(result.knownIssues[0].fixes[0]).toMatchObject({
        id: 'fix-1',
        likes: 5,
        dislikes: 1,
      });
      expect(cache.set).toHaveBeenCalledWith(cacheKey, result, 21600000);
    });

    it('falls back to Postgres when the cache get fails', async () => {
      cache.get.mockRejectedValue(new Error('redis unavailable'));
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ]);

      const result = await lookupsService.lookup(query);

      expect(vehicleModelsService.findByLookup).toHaveBeenCalled();
      expect(result.vehicle.id).toBe('vm-1');
    });

    it('does not fail the request when caching the result errors', async () => {
      const vehicleModel = { id: 'vm-1', brand: 'Volkswagen' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ]);
      cache.set.mockRejectedValue(new Error('redis unavailable'));

      const result = await lookupsService.lookup(query);

      expect(result.vehicle.id).toBe('vm-1');
    });

    it('on a full Postgres MISS, calls the AI provider and persists a new vehicle in a transaction', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);

      const aiResult: AiLookupResult = {
        vehicle: { ...aiVehicleResult, doors: 3, techSpecs: { power_hp: 50 } },
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
          name: 'Volkswagen Polo',
          yearFrom: 2001,
          yearTo: 2001,
          engine: '1.0',
          doors: 3,
          fuelType: FuelType.DIESEL,
          techSpecs: { power_hp: 50 },
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
            locale: LookupLocale.EnGb,
            aiGeneratedAt: expect.any(Date) as Date,
          },
          {
            vehicleModelId: 'vm-1',
            title: 'Rust',
            description: 'Wheel arches',
            severity: IssueSeverity.MEDIUM,
            typicalKm: null,
            sources: null,
            locale: LookupLocale.EnGb,
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
        vehicle: aiVehicleResult,
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
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ]);

      const result = await lookupsService.lookup({ ...query, doors: 3 });

      const doorsCacheKey =
        'vehicle:lookup:Volkswagen:Polo:2001:1.0:3:diesel:en-GB';
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
        vehicle: aiVehicleResult,
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup({ ...query, doors: 5 });

      expect(cache.get).toHaveBeenCalledWith(
        'vehicle:lookup:Volkswagen:Polo:2001:1.0:5:diesel:en-GB',
      );
    });

    it('prioritizes doors from the query over the AI result when persisting', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: { ...aiVehicleResult, doors: 5 },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

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
        vehicle: { ...aiVehicleResult, doors: 5 },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

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

    it('includes fuelType in the cache key and lookup criteria', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ]);

      const result = await lookupsService.lookup({
        ...query,
        fuelType: FuelType.ELECTRIC,
      });

      const electricCacheKey =
        'vehicle:lookup:Volkswagen:Polo:2001:1.0:electric:en-GB';
      expect(cache.get).toHaveBeenCalledWith(electricCacheKey);
      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        ...normalizedCriteria,
        fuelType: FuelType.ELECTRIC,
      });
      expect(cache.set).toHaveBeenCalledWith(
        electricCacheKey,
        result,
        21600000,
      );
    });

    it('persists the fuelType from the criteria, not the AI result', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: { ...aiVehicleResult, fuelType: FuelType.HYBRID },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query);

      expect(vehicleModelsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ fuelType: FuelType.DIESEL }),
        manager,
      );
    });

    it('persists the name from the AI result', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const aiResult: AiLookupResult = {
        vehicle: { ...aiVehicleResult, name: 'Polo 6N1' },
        knownIssues: [],
      };
      aiLookupProvider.generateLookup.mockResolvedValue(aiResult);

      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query);

      expect(vehicleModelsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Polo 6N1' }),
        manager,
      );
    });

    it('includes the requested language in the cache key and lookup criteria', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.PtPt, fixes: [] },
      ]);

      const result = await lookupsService.lookup({
        ...query,
        language: LookupLocale.PtPt,
      });

      const ptCacheKey = 'vehicle:lookup:Volkswagen:Polo:2001:1.0:diesel:pt-PT';
      expect(cache.get).toHaveBeenCalledWith(ptCacheKey);
      expect(vehicleModelsService.findByLookup).toHaveBeenCalledWith({
        ...normalizedCriteria,
        language: LookupLocale.PtPt,
      });
      expect(
        knownIssuesService.findByVehicleModelIdAndLocale,
      ).toHaveBeenCalledWith('vm-1', LookupLocale.PtPt);
      expect(cache.set).toHaveBeenCalledWith(ptCacheKey, result, 21600000);
    });

    it('defaults language to en-GB when the query omits it', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      aiLookupProvider.generateLookup.mockResolvedValue({
        vehicle: aiVehicleResult,
        knownIssues: [],
      });
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query);

      expect(aiLookupProvider.generateLookup).toHaveBeenCalledWith(
        expect.objectContaining({ language: LookupLocale.EnGb }),
      );
    });

    it('translates from the en-GB source when the requested locale is missing but en-GB issues exist, without creating a new vehicle', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);

      const enGbIssue = {
        id: 'ki-en-1',
        title: 'Gearbox',
        description: 'Wears out',
        severity: IssueSeverity.HIGH,
        typicalKm: 120000,
        sources: ['https://example.com'],
        locale: LookupLocale.EnGb,
        fixes: [
          {
            summary: 'Replace synchros',
            steps: 'Do it',
            estimatedCostEur: '450',
          },
        ],
      } as unknown as KnownIssue;
      knownIssuesService.findByVehicleModelId.mockResolvedValue([enGbIssue]);

      aiTranslateProvider.translate.mockResolvedValue({
        knownIssues: [
          {
            title: '[pt-PT] Gearbox',
            description: '[pt-PT] Wears out',
            severity: IssueSeverity.HIGH,
            typicalKm: 120000,
            sources: ['https://example.com'],
            fixes: [
              {
                summary: '[pt-PT] Replace synchros',
                steps: '[pt-PT] Do it',
                estimatedCostEur: 450,
              },
            ],
          },
        ],
      });

      const savedKnownIssues = [{ id: 'ki-pt-1' }] as KnownIssue[];
      const savedFixes = [{ id: 'fix-pt-1', knownIssueId: 'ki-pt-1' }] as Fix[];
      knownIssuesService.saveMany.mockResolvedValue(savedKnownIssues);
      fixesService.saveMany.mockResolvedValue(savedFixes);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      const result = await lookupsService.lookup({
        ...query,
        language: LookupLocale.PtPt,
      });

      expect(aiLookupProvider.generateLookup).not.toHaveBeenCalled();
      expect(vehicleModelsService.create).not.toHaveBeenCalled();
      expect(aiTranslateProvider.translate).toHaveBeenCalledWith({
        sourceLanguage: LookupLocale.EnGb,
        targetLanguage: LookupLocale.PtPt,
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
            ],
          },
        ],
      });
      expect(knownIssuesService.saveMany).toHaveBeenCalledWith(
        [
          {
            vehicleModelId: 'vm-1',
            title: '[pt-PT] Gearbox',
            description: '[pt-PT] Wears out',
            severity: IssueSeverity.HIGH,
            typicalKm: 120000,
            sources: ['https://example.com'],
            locale: LookupLocale.PtPt,
            aiGeneratedAt: expect.any(Date) as Date,
          },
        ],
        manager,
      );
      expect(result.vehicle.id).toBe('vm-1');
      expect(result.knownIssues).toHaveLength(1);
    });

    it('translates from the only available source locale when it is not en-GB', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);

      const ptIssue = {
        id: 'ki-pt-1',
        title: 'Caixa de velocidades',
        description: 'Desgasta-se',
        severity: IssueSeverity.HIGH,
        locale: LookupLocale.PtPt,
        fixes: [],
      } as unknown as KnownIssue;
      knownIssuesService.findByVehicleModelId.mockResolvedValue([ptIssue]);

      aiTranslateProvider.translate.mockResolvedValue({
        knownIssues: [
          {
            title: '[en-GB] Caixa de velocidades',
            description: '[en-GB] Desgasta-se',
            severity: IssueSeverity.HIGH,
            fixes: [],
          },
        ],
      });
      knownIssuesService.saveMany.mockResolvedValue([
        { id: 'ki-en-1' },
      ] as KnownIssue[]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup({ ...query, language: LookupLocale.EnGb });

      expect(aiTranslateProvider.translate).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceLanguage: LookupLocale.PtPt,
          targetLanguage: LookupLocale.EnGb,
        }),
      );
    });

    it('generates issues for an existing vehicle that has none in any locale yet, without creating a duplicate vehicle', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([]);

      aiLookupProvider.generateLookup.mockResolvedValue({
        vehicle: aiVehicleResult,
        knownIssues: [
          {
            title: 'Rust',
            description: 'Wheel arches',
            severity: IssueSeverity.LOW,
            fixes: [],
          },
        ],
      });
      knownIssuesService.saveMany.mockResolvedValue([
        { id: 'ki-1' },
      ] as KnownIssue[]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      const result = await lookupsService.lookup(query);

      expect(aiTranslateProvider.translate).not.toHaveBeenCalled();
      expect(vehicleModelsService.create).not.toHaveBeenCalled();
      expect(aiLookupProvider.generateLookup).toHaveBeenCalledWith(
        normalizedCriteria,
      );
      expect(knownIssuesService.saveMany).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            vehicleModelId: 'vm-1',
            locale: LookupLocale.EnGb,
          }),
        ],
        manager,
      );
      expect(result.vehicle.id).toBe('vm-1');
    });
  });

  describe('turnstile gating', () => {
    it('does not check the token on a Postgres HIT', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([
        { id: 'ki-1', locale: LookupLocale.EnGb, fixes: [] },
      ]);

      await lookupsService.lookup(query);

      expect(turnstileService.assertValid).not.toHaveBeenCalled();
    });

    it('checks the token before generating a new vehicle via AI', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      aiLookupProvider.generateLookup.mockResolvedValue({
        vehicle: aiVehicleResult,
        knownIssues: [],
      });
      vehicleModelsService.create.mockResolvedValue({ id: 'vm-1' });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query, 'turnstile-token');

      expect(turnstileService.assertValid).toHaveBeenCalledWith(
        'turnstile-token',
      );
    });

    it('propagates the ForbiddenException and skips the AI call when the token is invalid', async () => {
      vehicleModelsService.findByLookup.mockResolvedValue(null);
      const forbidden = new Error('TURNSTILE_REQUIRED');
      turnstileService.assertValid.mockRejectedValue(forbidden);

      await expect(lookupsService.lookup(query)).rejects.toThrow(forbidden);

      expect(aiLookupProvider.generateLookup).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('checks the token before generating issues for an existing vehicle via AI', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([]);
      aiLookupProvider.generateLookup.mockResolvedValue({
        vehicle: aiVehicleResult,
        knownIssues: [],
      });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(query, 'turnstile-token');

      expect(turnstileService.assertValid).toHaveBeenCalledWith(
        'turnstile-token',
      );
    });

    it('checks the token before translating existing issues via AI', async () => {
      const vehicleModel = { id: 'vm-1' } as VehicleModel;
      vehicleModelsService.findByLookup.mockResolvedValue(vehicleModel);
      knownIssuesService.findByVehicleModelIdAndLocale.mockResolvedValue([]);
      knownIssuesService.findByVehicleModelId.mockResolvedValue([
        {
          id: 'ki-en-1',
          locale: LookupLocale.EnGb,
          fixes: [],
        },
      ]);
      aiTranslateProvider.translate.mockResolvedValue({ knownIssues: [] });
      knownIssuesService.saveMany.mockResolvedValue([]);
      dataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(manager),
      );

      await lookupsService.lookup(
        { ...query, language: LookupLocale.PtPt },
        'turnstile-token',
      );

      expect(turnstileService.assertValid).toHaveBeenCalledWith(
        'turnstile-token',
      );
    });
  });
});
