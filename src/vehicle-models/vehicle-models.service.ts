import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { buildLookupCacheKeysForVehicleModel } from '../lookups/lookup-cache-key.util';
import { errorMessage } from '../redis/redis-error.util';
import { VehicleModel } from './entities/vehicle-model.entity';
import {
  VehicleLookupCriteria,
  VehicleModelPaginationCriteria,
  VehicleModelsRepository,
} from './vehicle-models.repository';

export interface PaginatedVehicleModels {
  items: VehicleModel[];
  total: number;
}

@Injectable()
export class VehicleModelsService {
  private readonly logger = new Logger(VehicleModelsService.name);

  constructor(
    private readonly vehicleModelsRepository: VehicleModelsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findById(id: string): Promise<VehicleModel | null> {
    return this.vehicleModelsRepository.findById(id);
  }

  countAll(): Promise<number> {
    return this.vehicleModelsRepository.countAll();
  }

  findByLookup(criteria: VehicleLookupCriteria): Promise<VehicleModel | null> {
    return this.vehicleModelsRepository.findByLookup(criteria);
  }

  create(
    data: Partial<VehicleModel>,
    manager?: EntityManager,
  ): Promise<VehicleModel> {
    const vehicleModel = this.vehicleModelsRepository.create(data);
    return this.vehicleModelsRepository.save(vehicleModel, manager);
  }

  async findPaginated(
    criteria: VehicleModelPaginationCriteria,
  ): Promise<PaginatedVehicleModels> {
    const [items, total] =
      await this.vehicleModelsRepository.findPaginated(criteria);
    return { items, total };
  }

  async update(id: string, data: Partial<VehicleModel>): Promise<VehicleModel> {
    const vehicleModel = await this.vehicleModelsRepository.findById(id);
    if (!vehicleModel) {
      throw new NotFoundException(`Vehicle model ${id} not found`);
    }

    Object.assign(vehicleModel, data);
    const saved = await this.vehicleModelsRepository.save(vehicleModel);
    await this.evictLookupCache(saved);
    return saved;
  }

  async softDelete(id: string): Promise<void> {
    const vehicleModel = await this.vehicleModelsRepository.findById(id);
    if (!vehicleModel) {
      throw new NotFoundException(`Vehicle model ${id} not found`);
    }

    await this.vehicleModelsRepository.softDelete(id);
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
