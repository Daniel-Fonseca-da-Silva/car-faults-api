import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from './entities/known-issue.entity';

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
}
