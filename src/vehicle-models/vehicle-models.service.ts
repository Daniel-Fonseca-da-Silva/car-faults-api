import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import {
  VehicleLookupCriteria,
  VehicleModelsRepository,
} from './vehicle-models.repository';

@Injectable()
export class VehicleModelsService {
  constructor(
    private readonly vehicleModelsRepository: VehicleModelsRepository,
  ) {}

  findById(id: string): Promise<VehicleModel | null> {
    return this.vehicleModelsRepository.findById(id);
  }

  findByLookup(criteria: VehicleLookupCriteria): Promise<VehicleModel | null> {
    return this.vehicleModelsRepository.findByLookup(criteria);
  }

  create(
    data: Partial<VehicleModel>,
    manager: EntityManager,
  ): Promise<VehicleModel> {
    const vehicleModel = this.vehicleModelsRepository.create(data);
    return this.vehicleModelsRepository.save(vehicleModel, manager);
  }
}
