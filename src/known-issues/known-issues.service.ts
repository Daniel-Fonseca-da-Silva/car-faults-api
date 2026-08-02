import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository, TopFaultRow } from './known-issues.repository';

@Injectable()
export class KnownIssuesService {
  constructor(private readonly knownIssuesRepository: KnownIssuesRepository) {}

  findByVehicleModelId(vehicleModelId: string): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.findByVehicleModelId(vehicleModelId);
  }

  countByVehicleModelId(vehicleModelId: string): Promise<number> {
    return this.knownIssuesRepository.countByVehicleModelId(vehicleModelId);
  }

  countByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<number> {
    return this.knownIssuesRepository.countByVehicleModelIdAndLocale(
      vehicleModelId,
      locale,
    );
  }

  findByVehicleModelIdAndLocale(
    vehicleModelId: string,
    locale: LookupLocale,
  ): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.findByVehicleModelIdAndLocale(
      vehicleModelId,
      locale,
    );
  }

  findById(id: string): Promise<KnownIssue | null> {
    return this.knownIssuesRepository.findById(id);
  }

  saveMany(
    knownIssues: Partial<KnownIssue>[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.saveMany(knownIssues, manager);
  }

  countAll(): Promise<number> {
    return this.knownIssuesRepository.countAll();
  }

  findTopByCommentCount(
    locale: LookupLocale,
    limit: number,
  ): Promise<TopFaultRow[]> {
    return this.knownIssuesRepository.findTopByCommentCount(locale, limit);
  }
}
