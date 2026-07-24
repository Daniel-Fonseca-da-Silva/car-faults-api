import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { KnownIssuesService } from '../known-issues/known-issues.service';
import { buildLookupCacheKeysForVehicleModel } from '../lookups/lookup-cache-key.util';
import { errorMessage } from '../redis/redis-error.util';
import { VehicleModelsService } from '../vehicle-models/vehicle-models.service';
import { Fix } from './entities/fix.entity';
import { FixSource } from './enums/fix-source.enum';
import { FixVoteValue } from './enums/fix-vote-value.enum';
import { FixVotesRepository } from './fix-votes.repository';
import { FixesRepository, FixWithCounts } from './fixes.repository';

export interface CreateFixData {
  knownIssueId: string;
  summary: string;
  steps: string;
  estimatedCostEur?: number;
}

export interface UpdateFixData {
  summary?: string;
  steps?: string;
  estimatedCostEur?: number;
}

@Injectable()
export class FixesService {
  private readonly logger = new Logger(FixesService.name);

  constructor(
    private readonly fixesRepository: FixesRepository,
    private readonly fixVotesRepository: FixVotesRepository,
    private readonly knownIssuesService: KnownIssuesService,
    private readonly vehicleModelsService: VehicleModelsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  saveMany(fixes: Partial<Fix>[], manager: EntityManager): Promise<Fix[]> {
    return this.fixesRepository.saveMany(fixes, manager);
  }

  findByKnownIssue(
    knownIssueId: string,
    userId?: string,
  ): Promise<FixWithCounts[]> {
    return this.fixesRepository.findByKnownIssueIdWithCounts(
      knownIssueId,
      userId,
    );
  }

  async create(userId: string, data: CreateFixData): Promise<FixWithCounts> {
    const knownIssue = await this.knownIssuesService.findById(
      data.knownIssueId,
    );
    if (!knownIssue) {
      throw new NotFoundException(`Known issue ${data.knownIssueId} not found`);
    }

    const fix = this.fixesRepository.create({
      knownIssueId: data.knownIssueId,
      userId,
      summary: data.summary,
      steps: data.steps,
      estimatedCostEur:
        data.estimatedCostEur !== undefined
          ? String(data.estimatedCostEur)
          : null,
      source: FixSource.USER,
    });
    const saved = await this.fixesRepository.save(fix);
    await this.evictLookupCache(knownIssue.vehicleModelId);
    return this.getWithCounts(saved.id, userId);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateFixData,
  ): Promise<FixWithCounts> {
    if (
      data.summary === undefined &&
      data.steps === undefined &&
      data.estimatedCostEur === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    const fix = await this.getOwned(id, userId);

    if (data.summary !== undefined) {
      fix.summary = data.summary;
    }
    if (data.steps !== undefined) {
      fix.steps = data.steps;
    }
    if (data.estimatedCostEur !== undefined) {
      fix.estimatedCostEur = String(data.estimatedCostEur);
    }

    const saved = await this.fixesRepository.save(fix);
    await this.evictLookupCacheForFix(saved);
    return this.getWithCounts(saved.id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const fix = await this.getOwned(id, userId);
    await this.fixesRepository.delete(id);
    await this.evictLookupCacheForFix(fix);
  }

  async vote(
    id: string,
    userId: string,
    value: FixVoteValue,
  ): Promise<FixWithCounts> {
    const fix = await this.fixesRepository.findById(id);
    if (!fix) {
      throw new NotFoundException(`Fix ${id} not found`);
    }
    if (fix.userId === userId) {
      throw new ForbiddenException('You cannot vote on your own fix');
    }

    const existing = await this.fixVotesRepository.findByFixAndUser(id, userId);
    if (existing) {
      existing.value = value;
      await this.fixVotesRepository.save(existing);
    } else {
      const vote = this.fixVotesRepository.create({
        fixId: id,
        userId,
        value,
      });
      await this.fixVotesRepository.save(vote);
    }

    await this.evictLookupCacheForFix(fix);
    return this.getWithCounts(id, userId);
  }

  async removeVote(id: string, userId: string): Promise<void> {
    const fix = await this.fixesRepository.findById(id);
    if (!fix) {
      throw new NotFoundException(`Fix ${id} not found`);
    }

    const existing = await this.fixVotesRepository.findByFixAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Vote not found');
    }

    await this.fixVotesRepository.delete(existing.id);
    await this.evictLookupCacheForFix(fix);
  }

  private async getOwned(id: string, userId: string): Promise<Fix> {
    const fix = await this.fixesRepository.findById(id);
    if (!fix || fix.userId !== userId || fix.source !== FixSource.USER) {
      throw new NotFoundException(`Fix ${id} not found`);
    }
    return fix;
  }

  private async getWithCounts(
    id: string,
    userId?: string,
  ): Promise<FixWithCounts> {
    const fix = await this.fixesRepository.findByIdWithCounts(id, userId);
    if (!fix) {
      throw new NotFoundException(`Fix ${id} not found`);
    }
    return fix;
  }

  private async evictLookupCacheForFix(fix: Fix): Promise<void> {
    const knownIssue = await this.knownIssuesService.findById(fix.knownIssueId);
    if (!knownIssue) {
      return;
    }
    await this.evictLookupCache(knownIssue.vehicleModelId);
  }

  private async evictLookupCache(vehicleModelId: string): Promise<void> {
    const vehicleModel =
      await this.vehicleModelsService.findById(vehicleModelId);
    if (!vehicleModel) {
      return;
    }

    const keys = buildLookupCacheKeysForVehicleModel(vehicleModel);
    await Promise.all(keys.map((key) => this.evictCacheKey(key)));
  }

  private async evictCacheKey(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for key ${key}: ${errorMessage(err)}`,
      );
    }
  }
}
