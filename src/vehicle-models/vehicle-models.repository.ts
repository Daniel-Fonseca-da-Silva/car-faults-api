import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { slugify } from '../common/utils/slugify.util';
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

export interface VehiclePathLookupCriteria {
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  engine: string;
  doors?: number;
}

export interface VehicleModelPaginationCriteria {
  page: number;
  limit: number;
  brand?: string;
  model?: string;
}

export interface VehicleCatalogPaginationCriteria {
  page: number;
  limit: number;
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

  async findByPathLookup(
    criteria: VehiclePathLookupCriteria,
  ): Promise<VehicleModel | null> {
    const { year, fuelType, doors } = criteria;
    const makeSlug = slugify(criteria.make);
    const modelSlug = slugify(criteria.model);
    const engineSlug = slugify(criteria.engine);

    const [openEnded, bounded] = await Promise.all([
      this.repository.find({
        where: {
          fuelType,
          yearFrom: LessThanOrEqual(year),
          yearTo: IsNull(),
        },
        order: { id: 'ASC' },
      }),
      this.repository.find({
        where: {
          fuelType,
          yearFrom: LessThanOrEqual(year),
          yearTo: MoreThanOrEqual(year),
        },
        order: { id: 'ASC' },
      }),
    ]);

    const matches = [...openEnded, ...bounded].filter(
      (candidate) =>
        slugify(candidate.brand) === makeSlug &&
        slugify(candidate.model) === modelSlug &&
        slugify(candidate.engine) === engineSlug,
    );

    if (matches.length === 0) {
      return null;
    }

    if (doors !== undefined) {
      const doorsMatch = matches.find((candidate) => candidate.doors === doors);
      if (doorsMatch) {
        return doorsMatch;
      }
    }

    return matches[0];
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

  async findCatalogPaginated(
    criteria: VehicleCatalogPaginationCriteria,
  ): Promise<[VehicleModel[], number]> {
    return this.repository.findAndCount({
      where: { fuelType: Not(IsNull()) },
      order: { brand: 'ASC', model: 'ASC', yearFrom: 'ASC', id: 'ASC' },
      skip: (criteria.page - 1) * criteria.limit,
      take: criteria.limit,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
