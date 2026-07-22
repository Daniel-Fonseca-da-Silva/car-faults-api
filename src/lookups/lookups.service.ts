import { Inject, Injectable } from '@nestjs/common';
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
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { LookupQueryDto } from './dto/lookup-query.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';

@Injectable()
export class LookupsService {
  constructor(
    private readonly vehicleModelsService: VehicleModelsService,
    private readonly knownIssuesService: KnownIssuesService,
    private readonly fixesService: FixesService,
    private readonly dataSource: DataSource,
    @Inject(AI_LOOKUP_PROVIDER)
    private readonly aiLookupProvider: AiLookupProvider,
  ) {}

  async lookup(query: LookupQueryDto): Promise<LookupResponseDto> {
    const criteria = {
      brand: query.brand.trim(),
      model: query.model.trim(),
      year: query.year,
      engine: query.engine.trim(),
    };

    const vehicleModel = await this.vehicleModelsService.findByLookup(criteria);
    if (vehicleModel) {
      const knownIssues = await this.knownIssuesService.findByVehicleModelId(
        vehicleModel.id,
      );
      return new LookupResponseDto(vehicleModel, knownIssues);
    }

    const aiResult = await this.aiLookupProvider.generateLookup(criteria);

    const persisted = await this.dataSource.transaction((manager) =>
      this.persistAiResult(criteria, aiResult, manager),
    );

    return new LookupResponseDto(persisted.vehicleModel, persisted.knownIssues);
  }

  private async persistAiResult(
    criteria: { brand: string; model: string; year: number; engine: string },
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
        doors: aiResult.vehicle.doors ?? null,
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
