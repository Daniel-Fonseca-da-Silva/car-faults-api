import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';

@Injectable()
export class KnownIssuesService {
  constructor(private readonly knownIssuesRepository: KnownIssuesRepository) {}

  findByVehicleModelId(vehicleModelId: string): Promise<KnownIssue[]> {
    return this.knownIssuesRepository.findByVehicleModelId(vehicleModelId);
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
}
