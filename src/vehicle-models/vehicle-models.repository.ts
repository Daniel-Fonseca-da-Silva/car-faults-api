import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';

export interface VehicleLookupCriteria {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
}

@Injectable()
export class VehicleModelsRepository {
  constructor(
    @InjectRepository(VehicleModel)
    private readonly repository: Repository<VehicleModel>,
  ) {}

  findById(id: string): Promise<VehicleModel | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByLookup(
    criteria: VehicleLookupCriteria,
  ): Promise<VehicleModel | null> {
    const { brand, model, year, engine, doors } = criteria;
    const doorsWhere = doors !== undefined ? { doors } : {};

    const openEnded = await this.repository.findOne({
      where: {
        brand,
        model,
        engine,
        ...doorsWhere,
        yearFrom: LessThanOrEqual(year),
        yearTo: IsNull(),
      },
    });
    if (openEnded) {
      return openEnded;
    }

    return this.repository.findOne({
      where: {
        brand,
        model,
        engine,
        ...doorsWhere,
        yearFrom: LessThanOrEqual(year),
        yearTo: MoreThanOrEqual(year),
      },
    });
  }

  create(data: Partial<VehicleModel>): VehicleModel {
    return this.repository.create(data);
  }

  save(
    vehicleModel: VehicleModel,
    manager?: EntityManager,
  ): Promise<VehicleModel> {
    const repository = manager
      ? manager.getRepository(VehicleModel)
      : this.repository;
    return repository.save(vehicleModel);
  }
}
