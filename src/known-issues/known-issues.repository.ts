import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  saveMany(
    knownIssues: Partial<KnownIssue>[],
    manager: EntityManager,
  ): Promise<KnownIssue[]> {
    return manager.getRepository(KnownIssue).save(knownIssues);
  }
}
