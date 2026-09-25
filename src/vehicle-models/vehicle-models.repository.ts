import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import {
  buildKeysetWhere,
  KeysetColumn,
} from '../common/pagination/keyset.util';
import { splitPage } from '../common/pagination/paginate.util';
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
  limit: number;
  cursor?: string;
  brand?: string;
  model?: string;
  hasImage?: boolean;
}

export interface VehicleCatalogPaginationCriteria {
  limit: number;
  cursor?: string;
}

export interface VehicleModelsCursorPage {
  items: VehicleModel[];
  nextCursor: string | null;
}

interface CatalogCursor {
  [key: string]: string | number;
  brand: string;
  model: string;
  yearFrom: number;
  id: string;
}

const CATALOG_KEYSET_COLUMNS: KeysetColumn[] = [
  { expr: 'vehicle_model.brand', direction: 'ASC', param: 'brand' },
  { expr: 'vehicle_model.model', direction: 'ASC', param: 'model' },
  { expr: 'vehicle_model.year_from', direction: 'ASC', param: 'yearFrom' },
  { expr: 'vehicle_model.id', direction: 'ASC', param: 'id' },
];

function cursorOf(vehicleModel: VehicleModel): CatalogCursor {
  return {
    brand: vehicleModel.brand,
    model: vehicleModel.model,
    yearFrom: vehicleModel.yearFrom,
    id: vehicleModel.id,
  };
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
  ): Promise<VehicleModelsCursorPage> {
    const { limit, cursor, brand, model, hasImage } = criteria;
    const qb = this.repository
      .createQueryBuilder('vehicle_model')
      .orderBy('vehicle_model.brand', 'ASC')
      .addOrderBy('vehicle_model.model', 'ASC')
      .addOrderBy('vehicle_model.year_from', 'ASC')
      .addOrderBy('vehicle_model.id', 'ASC')
      .take(limit + 1);

    if (brand) {
      qb.andWhere('vehicle_model.brand ILIKE :brand', { brand: `%${brand}%` });
    }
    if (model) {
      qb.andWhere('vehicle_model.model ILIKE :model', { model: `%${model}%` });
    }
    if (hasImage === true) {
      qb.andWhere(
        "vehicle_model.image_url IS NOT NULL AND vehicle_model.image_url <> ''",
      );
    } else if (hasImage === false) {
      qb.andWhere(
        "(vehicle_model.image_url IS NULL OR vehicle_model.image_url = '')",
      );
    }
    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        CATALOG_KEYSET_COLUMNS,
        decodeCursor<CatalogCursor>(cursor),
      );
      qb.andWhere(sql, params);
    }

    const rows = await qb.getMany();
    const { items, hasMore } = splitPage(rows, limit);
    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(cursorOf(last)) : null;
    return { items, nextCursor };
  }

  async findCatalogPaginated(
    criteria: VehicleCatalogPaginationCriteria,
  ): Promise<VehicleModelsCursorPage> {
    const { limit, cursor } = criteria;
    const qb = this.repository
      .createQueryBuilder('vehicle_model')
      .where('vehicle_model.fuel_type IS NOT NULL')
      .andWhere(
        `EXISTS (
          SELECT 1 FROM known_issues ki
          WHERE ki.vehicle_model_id = vehicle_model.id
            AND ki.deleted_at IS NULL
        )`,
      )
      .orderBy('vehicle_model.brand', 'ASC')
      .addOrderBy('vehicle_model.model', 'ASC')
      .addOrderBy('vehicle_model.year_from', 'ASC')
      .addOrderBy('vehicle_model.id', 'ASC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        CATALOG_KEYSET_COLUMNS,
        decodeCursor<CatalogCursor>(cursor),
      );
      qb.andWhere(sql, params);
    }

    const rows = await qb.getMany();
    const { items, hasMore } = splitPage(rows, limit);
    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(cursorOf(last)) : null;
    return { items, nextCursor };
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
