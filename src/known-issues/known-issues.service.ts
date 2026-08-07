import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { buildLookupCacheKeysForVehicleModel } from '../lookups/lookup-cache-key.util';
import { errorMessage } from '../redis/redis-error.util';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { KnownIssue } from './entities/known-issue.entity';
import { IssueSeverity } from './enums/issue-severity.enum';
import { KnownIssuesRepository, TopFaultRow } from './known-issues.repository';

export interface CreateKnownIssueData {
  vehicleModelId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  locale?: LookupLocale;
  typicalKm?: number | null;
  sources?: string[] | null;
}

export interface UpdateKnownIssueData {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  locale?: LookupLocale;
  typicalKm?: number | null;
  sources?: string[] | null;
}

@Injectable()
export class KnownIssuesService {
  private readonly logger = new Logger(KnownIssuesService.name);

  constructor(
    private readonly knownIssuesRepository: KnownIssuesRepository,
    private readonly vehicleModelsService: VehicleModelsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findByVehicleModelId(vehicleModelId: string): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.findByVehicleModelId(vehicleModelId);
  }

  countByVehicleModelId(vehicleModelId: string): Promise<number> {
    return this.knownIssuesRepository.countByVehicleModelId(vehicleModelId);
  }

  countByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<number> {
    return this.knownIssuesRepository.countByVehicleModelIdAndLocale(
      vehicleModelId,
      locale,
    );
  }

  findByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.findByVehicleModelIdAndLocale(
      vehicleModelId,
      locale,
    );
  }

  findById(id: string): Promise<KnownIssue | null> {
    return this.knownIssuesRepository.findById(id);
  }

  countAll(): Promise<number> {
    return this.knownIssuesRepository.countAll();
  }

  findTopByCommentCount(
    locale: LookupLocale,
    limit: number,
  ): Promise<TopFaultRow[]> {
    return this.knownIssuesRepository.findTopByCommentCount(locale, limit);
  }

  saveMany(
    knownIssues: Partial<KnownIssue>[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.saveMany(knownIssues, manager);
  }

  findByIdWithFixes(id: string): Promise<KnownIssue | null> {
    return this.knownIssuesRepository.findByIdWithFixes(id);
  }

  async create(data: CreateKnownIssueData): Promise<KnownIssue> {
    const vehicleModel = await this.vehicleModelsService.findById(
      data.vehicleModelId,
    );
    if (!vehicleModel) {
      throw new NotFoundException(
        `Vehicle model ${data.vehicleModelId} not found`,
      );
    }

    const knownIssue = this.knownIssuesRepository.create({
      ...data,
      aiGeneratedAt: null,
    });
    const saved = await this.knownIssuesRepository.save(knownIssue);
    await this.evictLookupCache(vehicleModel);
    return saved;
  }

  async update(id: string, data: UpdateKnownIssueData): Promise<KnownIssue> {
    const knownIssue = await this.knownIssuesRepository.findById(id);
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${id} not found`);
    }

    Object.assign(knownIssue, data);
    const saved = await this.knownIssuesRepository.save(knownIssue);
    await this.evictLookupCacheForVehicleModel(saved.vehicleModelId);
    return saved;
  }

  async softDelete(id: string): Promise<void> {
    const knownIssue = await this.knownIssuesRepository.findById(id);
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${id} not found`);
    }

    await this.knownIssuesRepository.softDelete(id);
    await this.evictLookupCacheForVehicleModel(knownIssue.vehicleModelId);
  }

  private async evictLookupCacheForVehicleModel(
    vehicleModelId: string,
  ): Promise<void> {
    const vehicleModel =
      await this.vehicleModelsService.findById(vehicleModelId);
    if (!vehicleModel) {
      return;
    }
    await this.evictLookupCache(vehicleModel);
  }

  private async evictLookupCache(vehicleModel: VehicleModel): Promise<void> {
    const keys = buildLookupCacheKeysForVehicleModel(vehicleModel);
    await Promise.all(
      keys.map(async (key) => {
        try {
          await this.cache.del(key);
        } catch (err) {
          this.logger.warn(
            `Cache invalidation failed for key ${key}: ${errorMessage(err)}`,
          );
        }
      }),
    );
  }
}
