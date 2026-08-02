import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
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

  saveMany(
    knownIssues: Partial<KnownIssue>[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    return manager.getRepository(KnownIssue).save(knownIssues);
  }

  countAll(): Promise<number> {
    return this.repository.count();
  }

  async findTopByCommentCount(
    locale: LookupLocale,
    limit: number,
  ): Promise<TopFaultRow[]> {
    const raw = await this.repository
      .createQueryBuilder('ki')
      .innerJoin('ki.vehicleModel', 'vm')
      .leftJoin(
        'comments',
        'c',
        'c.known_issue_id = ki.id AND c.deleted_at IS NULL',
      )
      .where('ki.deleted_at IS NULL')
      .andWhere('ki.locale = :locale', { locale })
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
      .limit(limit)
      .getRawMany<RawTopFaultRow>();

    return raw.map((row) => ({
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
  }
}
