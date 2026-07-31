import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { AI_LOOKUP_PROVIDER } from '../ai/ai-lookup.provider';
import type {
  AiLookupProvider,
  AiLookupResult,
} from '../ai/ai-lookup.provider';
import { AI_TRANSLATE_PROVIDER } from '../ai/ai-translate.provider';
import type {
  AiTranslateInput,
  AiTranslateProvider,
} from '../ai/ai-translate.provider';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { Fix } from '../fixes/entities/fix.entity';
import { FixSource } from '../fixes/enums/fix-source.enum';
import { FixesService } from '../fixes/fixes.service';
import { KnownIssue } from '../known-issues/entities/known-issue.entity';
import { IssueSeverity } from '../known-issues/enums/issue-severity.enum';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { errorMessage } from '../redis/redis-error.util';
import { TurnstileService } from '../turnstile/turnstile.service';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
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
  fuelType: FuelType;
  language: LookupLocale;
}

interface PersistableFix {
  summary: string;
  steps: string;
  estimatedCostEur?: number | null;
}

interface PersistableKnownIssue {
  title: string;
  description: string;
  severity: IssueSeverity;
  typicalKm?: number | null;
  sources?: string[] | null;
  fixes: PersistableFix[];
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
    @Inject(AI_TRANSLATE_PROVIDER)
    private readonly aiTranslateProvider: AiTranslateProvider,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly turnstileService: TurnstileService,
    config: ConfigService,
  ) {
    this.cacheTtlMs = Number(
      config.getOrThrow<string>('REDIS_LOOKUP_CACHE_TTL_MS'),
    );
  }

  async lookup(
    query: LookupQueryDto,
    turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    const criteria: LookupCriteria = {
      brand: query.brand.trim(),
      model: query.model.trim(),
      year: query.year,
      engine: query.engine.trim(),
      fuelType: query.fuelType,
      language: query.language ?? LookupLocale.EnGb,
      ...(query.doors !== undefined ? { doors: query.doors } : {}),
    };

    const cacheKey = this.lookupCacheKey(criteria);
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.lookupUncached(criteria, turnstileToken);
    await this.setCached(cacheKey, result);
    return result;
  }

  private async lookupUncached(
    criteria: LookupCriteria,
    turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    const vehicleModel = await this.vehicleModelsService.findByLookup(criteria);
    if (!vehicleModel) {
      return this.generateForNewVehicle(criteria, turnstileToken);
    }

    const localeIssues =
      await this.knownIssuesService.findByVehicleModelIdAndLocale(
        vehicleModel.id,
        criteria.language,
      );
    if (localeIssues.length > 0) {
      const knownIssuesWithCounts = await this.attachFixCounts(localeIssues);
      return new LookupResponseDto(vehicleModel, knownIssuesWithCounts);
    }

    const existingIssues = await this.knownIssuesService.findByVehicleModelId(
      vehicleModel.id,
    );
    if (existingIssues.length === 0) {
      return this.generateForExistingVehicle(
        vehicleModel,
        criteria,
        turnstileToken,
      );
    }

    return this.translateForExistingVehicle(
      vehicleModel,
      criteria.language,
      existingIssues,
      turnstileToken,
    );
  }

  private async generateForNewVehicle(
    criteria: LookupCriteria,
    turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    await this.turnstileService.assertValid(turnstileToken);
    const aiResult = await this.aiLookupProvider.generateLookup(criteria);

    const persisted = await this.dataSource.transaction((manager) =>
      this.persistAiResult(criteria, aiResult, manager),
    );

    return new LookupResponseDto(persisted.vehicleModel, persisted.knownIssues);
  }

  private async generateForExistingVehicle(
    vehicleModel: VehicleModel,
    criteria: LookupCriteria,
    turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    await this.turnstileService.assertValid(turnstileToken);
    const aiResult = await this.aiLookupProvider.generateLookup(criteria);

    const knownIssues = await this.dataSource.transaction((manager) =>
      this.persistKnownIssuesAndFixes(
        vehicleModel.id,
        criteria.language,
        aiResult.knownIssues,
        manager,
      ),
    );

    return new LookupResponseDto(vehicleModel, knownIssues);
  }

  private async translateForExistingVehicle(
    vehicleModel: VehicleModel,
    targetLanguage: LookupLocale,
    existingIssues: KnownIssue[],
    turnstileToken?: string,
  ): Promise<LookupResponseDto> {
    await this.turnstileService.assertValid(turnstileToken);
    const sourceLanguage = this.pickSourceLanguage(existingIssues);
    const issuesToTranslate = existingIssues.filter(
      (issue) => issue.locale === sourceLanguage,
    );

    const translateInput = this.buildTranslateInput(
      sourceLanguage,
      targetLanguage,
      issuesToTranslate,
    );
    const translateResult =
      await this.aiTranslateProvider.translate(translateInput);

    const knownIssues = await this.dataSource.transaction((manager) =>
      this.persistKnownIssuesAndFixes(
        vehicleModel.id,
        targetLanguage,
        translateResult.knownIssues,
        manager,
      ),
    );

    return new LookupResponseDto(vehicleModel, knownIssues);
  }

  private pickSourceLanguage(issues: KnownIssue[]): LookupLocale {
    const hasEnGb = issues.some((issue) => issue.locale === LookupLocale.EnGb);
    return hasEnGb ? LookupLocale.EnGb : issues[0].locale;
  }

  private buildTranslateInput(
    sourceLanguage: LookupLocale,
    targetLanguage: LookupLocale,
    issues: KnownIssue[],
  ): AiTranslateInput {
    return {
      sourceLanguage,
      targetLanguage,
      knownIssues: issues.map((issue) => ({
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        typicalKm: issue.typicalKm,
        sources: issue.sources,
        fixes: (issue.fixes ?? []).map((fix) => ({
          summary: fix.summary,
          steps: fix.steps,
          estimatedCostEur:
            fix.estimatedCostEur != null ? Number(fix.estimatedCostEur) : null,
        })),
      })),
    };
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
        name: aiResult.vehicle.name ?? null,
        yearFrom: criteria.year,
        yearTo: criteria.year,
        engine: criteria.engine,
        doors: criteria.doors ?? aiResult.vehicle.doors ?? null,
        fuelType: criteria.fuelType,
        techSpecs: aiResult.vehicle.techSpecs ?? null,
      },
      manager,
    );

    const knownIssues = await this.persistKnownIssuesAndFixes(
      vehicleModel.id,
      criteria.language,
      aiResult.knownIssues,
      manager,
    );

    return { vehicleModel, knownIssues };
  }

  private async persistKnownIssuesAndFixes(
    vehicleModelId: string,
    locale: LookupLocale,
    aiKnownIssues: PersistableKnownIssue[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    const savedKnownIssues = await this.knownIssuesService.saveMany(
      aiKnownIssues.map((issue) => ({
        vehicleModelId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        typicalKm: issue.typicalKm ?? null,
        sources: issue.sources ?? null,
        locale,
        aiGeneratedAt: new Date(),
      })),
      manager,
    );

    const savedFixes = await this.saveFixes(
      aiKnownIssues,
      savedKnownIssues,
      manager,
    );

    let cursor = 0;
    return savedKnownIssues.map((knownIssue, index) => {
      const fixCount = aiKnownIssues[index].fixes.length;
      const fixes = savedFixes.slice(cursor, cursor + fixCount);
      cursor += fixCount;
      return { ...knownIssue, fixes };
    });
  }

  private saveFixes(
    aiKnownIssues: PersistableKnownIssue[],
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
