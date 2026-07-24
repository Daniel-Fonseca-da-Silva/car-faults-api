import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { AI_LOOKUP_PROVIDER } from '../ai/ai-lookup.provider';
import type {
  AiKnownIssueResult,
  AiLookupProvider,
  AiLookupResult,
} from '../ai/ai-lookup.provider';
import { Fix } from '../fixes/entities/fix.entity';
import { FixSource } from '../fixes/enums/fix-source.enum';
import { FixesService } from '../fixes/fixes.service';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { errorMessage } from '../redis/redis-error.util';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { buildLookupCacheKey } from './lookup-cache-key.util';

interface LookupCriteria {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
}

@Injectable()
export class LookupsService {
  private readonly logger = new Logger(LookupsService.name);
  private readonly cacheTtlMs: number;

  constructor(
    private readonly vehicleModelsService: VehicleModelsService,
    private readonly knownIssuesService: KnownIssuesService,
    private readonly fixesService: FixesService,
    private readonly dataSource: DataSource,
    @Inject(AI_LOOKUP_PROVIDER)
    private readonly aiLookupProvider: AiLookupProvider,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    config: ConfigService,
  ) {
    this.cacheTtlMs = Number(
      config.getOrThrow<string>('REDIS_LOOKUP_CACHE_TTL_MS'),
    );
  }

  async lookup(query: LookupQueryDto): Promise<LookupResponseDto> {
    const criteria: LookupCriteria = {
      brand: query.brand.trim(),
      model: query.model.trim(),
      year: query.year,
      engine: query.engine.trim(),
      ...(query.doors !== undefined ? { doors: query.doors } : {}),
    };

    const cacheKey = this.lookupCacheKey(criteria);
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.lookupUncached(criteria);
    await this.setCached(cacheKey, result);
    return result;
  }

  private async lookupUncached(
    criteria: LookupCriteria,
  ): Promise<LookupResponseDto> {
    const vehicleModel = await this.vehicleModelsService.findByLookup(criteria);
    if (vehicleModel) {
      const knownIssues = await this.knownIssuesService.findByVehicleModelId(
        vehicleModel.id,
      );
      const knownIssuesWithCounts = await this.attachFixCounts(knownIssues);
      return new LookupResponseDto(vehicleModel, knownIssuesWithCounts);
    }

    const aiResult = await this.aiLookupProvider.generateLookup(criteria);

    const persisted = await this.dataSource.transaction((manager) =>
      this.persistAiResult(criteria, aiResult, manager),
    );

    return new LookupResponseDto(persisted.vehicleModel, persisted.knownIssues);
  }

  private async attachFixCounts(
    knownIssues: KnownIssue[],
  ): Promise<KnownIssue[]> {
    return Promise.all(
      knownIssues.map(async (knownIssue) => ({
        ...knownIssue,
        fixes: await this.fixesService.findByKnownIssue(knownIssue.id),
      })),
    );
  }

  private lookupCacheKey(criteria: LookupCriteria): string {
    return buildLookupCacheKey(criteria);
  }

  private async getCached(key: string): Promise<LookupResponseDto | undefined> {
    try {
      return await this.cache.get<LookupResponseDto>(key);
    } catch (err) {
      this.logger.warn(`Cache get failed for key ${key}: ${errorMessage(err)}`);
      return undefined;
    }
  }

  private async setCached(
    key: string,
    result: LookupResponseDto,
  ): Promise<void> {
    try {
      await this.cache.set(key, result, this.cacheTtlMs);
    } catch (err) {
      this.logger.warn(`Cache set failed for key ${key}: ${errorMessage(err)}`);
    }
  }

  private async persistAiResult(
    criteria: LookupCriteria,
    aiResult: AiLookupResult,
    manager: EntityManager,
  ): Promise<{ vehicleModel: VehicleModel; knownIssues: KnownIssue[] }> {
    // A new catalog entry starts as a single-year record so a repeat
    // lookup for this exact year hits Postgres instead of the AI again.
    const vehicleModel = await this.vehicleModelsService.create(
      {
        brand: criteria.brand,
        model: criteria.model,
        yearFrom: criteria.year,
        yearTo: criteria.year,
        engine: criteria.engine,
        doors: criteria.doors ?? aiResult.vehicle.doors ?? null,
        techSpecs: aiResult.vehicle.techSpecs ?? null,
      },
      manager,
    );

    const savedKnownIssues = await this.knownIssuesService.saveMany(
      aiResult.knownIssues.map((issue) => ({
        vehicleModelId: vehicleModel.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        typicalKm: issue.typicalKm ?? null,
        sources: issue.sources ?? null,
        aiGeneratedAt: new Date(),
      })),
      manager,
    );

    const savedFixes = await this.saveFixes(
      aiResult.knownIssues,
      savedKnownIssues,
      manager,
    );

    let cursor = 0;
    const knownIssues = savedKnownIssues.map((knownIssue, index) => {
      const fixCount = aiResult.knownIssues[index].fixes.length;
      const fixes = savedFixes.slice(cursor, cursor + fixCount);
      cursor += fixCount;
      return { ...knownIssue, fixes };
    });

    return { vehicleModel, knownIssues };
  }

  private saveFixes(
    aiKnownIssues: AiKnownIssueResult[],
    savedKnownIssues: KnownIssue[],
    manager: EntityManager,
  ): Promise<Fix[]> {
    const fixesToCreate = aiKnownIssues.flatMap((issue, index) =>
      issue.fixes.map((fix) => ({
        knownIssueId: savedKnownIssues[index].id,
        userId: null,
        summary: fix.summary,
        steps: fix.steps,
        estimatedCostEur:
          fix.estimatedCostEur != null ? String(fix.estimatedCostEur) : null,
        source: FixSource.AI,
      })),
    );

    if (fixesToCreate.length === 0) {
      return Promise.resolve([]);
    }

    return this.fixesService.saveMany(fixesToCreate, manager);
  }
}
