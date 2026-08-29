import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.util';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { splitPage } from '../common/pagination/paginate.util';
import { FuelType } from '../vehicle-models/enums/fuel-type.enum';
import { KnownIssue } from './entities/known-issue.entity';
import { IssueSeverity } from './enums/issue-severity.enum';

export interface TopFaultRow {
  id: string;
  title: string;
  severity: IssueSeverity;
  reportCount: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYearFrom: number;
  vehicleEngine: string;
  vehicleFuelType: FuelType | null;
  vehicleDoors: number | null;
}

export interface FaultsCriteria {
  locale: LookupLocale;
  limit: number;
  cursor?: string;
  brand?: string;
  model?: string;
  year?: number;
  engine?: string;
  fuelType?: FuelType;
  doors?: number;
}

export interface FaultsPage {
  items: TopFaultRow[];
  nextCursor: string | null;
}

interface FaultsCursor {
  [key: string]: string | number;
  reportCount: number;
  id: string;
}

export interface KnownIssueCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

interface RawTopFaultRow {
  id: string;
  title: string;
  severity: IssueSeverity;
  reportCount: string | number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYearFrom: string | number;
  vehicleEngine: string;
  vehicleFuelType: FuelType | null;
  vehicleDoors: string | number | null;
}

@Injectable()
export class KnownIssuesRepository {
  constructor(
    @InjectRepository(KnownIssue)
    private readonly repository: Repository<KnownIssue>,
  ) {}

  findByVehicleModelId(vehicleModelId: string): Promise<KnownIssue[]> {
    return this.repository.find({
      where: { vehicleModelId },
      relations: { fixes: true },
    });
  }

  findPageByVehicleModelId(
    vehicleModelId: string,
    limit: number,
    cursor?: KnownIssueCursor,
  ): Promise<KnownIssue[]> {
    // No fixes join: this list's response DTO doesn't render fixes, and
    // limit+1 with a to-many joined relation would cap joined rows rather
    // than known_issue rows.
    const qb = this.repository
      .createQueryBuilder('known_issue')
      .where('known_issue.vehicle_model_id = :vehicleModelId', {
        vehicleModelId,
      })
      .orderBy('known_issue.created_at', 'DESC')
      .addOrderBy('known_issue.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          {
            expr: 'known_issue.created_at',
            direction: 'DESC',
            param: 'createdAt',
          },
          { expr: 'known_issue.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getMany();
  }

  countByVehicleModelId(vehicleModelId: string): Promise<number> {
    return this.repository.count({ where: { vehicleModelId } });
  }

  countByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<number> {
    return this.repository.count({ where: { vehicleModelId, locale } });
  }

  findByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<KnownIssue[]> {
    return this.repository.find({
      where: { vehicleModelId, locale },
      relations: { fixes: true },
    });
  }

  findById(id: string): Promise<KnownIssue | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdWithFixes(id: string): Promise<KnownIssue | null> {
    return this.repository.findOne({
      where: { id },
      relations: { fixes: true },
    });
  }

  saveMany(
    knownIssues: Partial<KnownIssue>[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    return manager.getRepository(KnownIssue).save(knownIssues);
  }

  create(data: Partial<KnownIssue>): KnownIssue {
    return this.repository.create(data);
  }

  save(knownIssue: KnownIssue): Promise<KnownIssue> {
    return this.repository.save(knownIssue);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  countAll(): Promise<number> {
    return this.repository.count();
  }

  async findFaultsPaginated(criteria: FaultsCriteria): Promise<FaultsPage> {
    const { limit, cursor } = criteria;

    const qb = this.buildFaultsQuery(criteria)
      .select('ki.id', 'id')
      .addSelect('ki.title', 'title')
      .addSelect('ki.severity', 'severity')
      .addSelect('vm.brand', 'vehicleBrand')
      .addSelect('vm.model', 'vehicleModel')
      .addSelect('vm.year_from', 'vehicleYearFrom')
      .addSelect('vm.engine', 'vehicleEngine')
      .addSelect('vm.fuel_type', 'vehicleFuelType')
      .addSelect('vm.doors', 'vehicleDoors')
      .addSelect('COUNT(c.id)', 'reportCount')
      .groupBy('ki.id')
      .addGroupBy('vm.brand')
      .addGroupBy('vm.model')
      .addGroupBy('vm.year_from')
      .addGroupBy('vm.engine')
      .addGroupBy('vm.fuel_type')
      .addGroupBy('vm.doors')
      .having('COUNT(c.id) > 0')
      .orderBy('COUNT(c.id)', 'DESC')
      .addOrderBy('ki.id', 'DESC')
      .limit(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          { expr: 'COUNT(c.id)', direction: 'DESC', param: 'reportCount' },
          { expr: 'ki.id', direction: 'DESC', param: 'id' },
        ],
        decodeCursor<FaultsCursor>(cursor),
      );
      qb.andHaving(sql, params);
    }

    const raw = await qb.getRawMany<RawTopFaultRow>();
    const { items: rawItems, hasMore } = splitPage(raw, limit);
    const items = rawItems.map((row) => ({
      id: row.id,
      title: row.title,
      severity: row.severity,
      reportCount: Number(row.reportCount),
      vehicleBrand: row.vehicleBrand,
      vehicleModel: row.vehicleModel,
      vehicleYearFrom: Number(row.vehicleYearFrom),
      vehicleEngine: row.vehicleEngine,
      vehicleFuelType: row.vehicleFuelType,
      vehicleDoors: row.vehicleDoors == null ? null : Number(row.vehicleDoors),
    }));

    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ reportCount: last.reportCount, id: last.id })
        : null;

    return { items, nextCursor };
  }

  private buildFaultsQuery(
    criteria: FaultsCriteria,
  ): SelectQueryBuilder<KnownIssue> {
    const { locale, brand, model, year, engine, fuelType, doors } = criteria;

    const qb = this.repository
      .createQueryBuilder('ki')
      .innerJoin('ki.vehicleModel', 'vm')
      .leftJoin(
        'comments',
        'c',
        'c.known_issue_id = ki.id AND c.deleted_at IS NULL',
      )
      .where('ki.deleted_at IS NULL')
      .andWhere('ki.locale = :locale', { locale });

    if (brand) {
      qb.andWhere('vm.brand ILIKE :brand', { brand: `%${brand}%` });
    }
    if (model) {
      qb.andWhere('vm.model ILIKE :model', { model: `%${model}%` });
    }
    if (engine) {
      qb.andWhere('vm.engine ILIKE :engine', { engine: `%${engine}%` });
    }
    if (fuelType) {
      qb.andWhere('vm.fuel_type = :fuelType', { fuelType });
    }
    if (doors != null) {
      qb.andWhere('vm.doors = :doors', { doors });
    }
    if (year != null) {
      qb.andWhere('vm.year_from <= :year', { year });
      qb.andWhere('(vm.year_to IS NULL OR vm.year_to >= :year)', { year });
    }

    return qb;
  }
}
