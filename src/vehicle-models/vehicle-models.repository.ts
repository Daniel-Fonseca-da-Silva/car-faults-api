import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { FuelType } from './enums/fuel-type.enum';

export interface VehicleLookupCriteria {
  brand: string;
  model: string;
  year: number;
  engine: string;
  doors?: number;
  fuelType?: FuelType;
}

export interface VehicleModelPaginationCriteria {
  page: number;
  limit: number;
  brand?: string;
  model?: string;
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

  countAll(): Promise<number> {
    return this.repository.count();
  }

  async findByLookup(
    criteria: VehicleLookupCriteria,
  ): Promise<VehicleModel | null> {
    const { brand, model, year, engine, doors, fuelType } = criteria;
    const doorsWhere = doors !== undefined ? { doors } : {};
    const fuelTypeWhere = fuelType !== undefined ? { fuelType } : {};

    const openEnded = await this.repository.findOne({
      where: {
        brand,
        model,
        engine,
        ...doorsWhere,
        ...fuelTypeWhere,
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
        ...fuelTypeWhere,
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

  async findPaginated(
    criteria: VehicleModelPaginationCriteria,
  ): Promise<[VehicleModel[], number]> {
    return this.repository.findAndCount({
      where: {
        ...(criteria.brand ? { brand: ILike(`%${criteria.brand}%`) } : {}),
        ...(criteria.model ? { model: ILike(`%${criteria.model}%`) } : {}),
      },
      order: { brand: 'ASC', model: 'ASC', yearFrom: 'ASC' },
      skip: (criteria.page - 1) * criteria.limit,
      take: criteria.limit,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
