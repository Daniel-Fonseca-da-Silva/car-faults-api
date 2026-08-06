import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LookupLocale } from '../common/enums/lookup-locale.enum';
import { KnownIssue } from './entities/known-issue.entity';

export type KnownIssueWithCommentCount = KnownIssue & { commentCount: number };

interface RawTopFaultCount {
  commentCount: string | number;
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

  countAll(): Promise<number> {
    return this.repository.count();
  }

  async findTopByCommentCount(
    locale: LookupLocale,
    limit: number,
  ): Promise<KnownIssueWithCommentCount[]> {
    const { entities, raw } = await this.repository
      .createQueryBuilder('ki')
      .innerJoinAndSelect('ki.vehicleModel', 'vm')
      .leftJoin(
        'comments',
        'c',
        'c.known_issue_id = ki.id AND c.deleted_at IS NULL',
      )
      .addSelect('COUNT(c.id)', 'commentCount')
      .where('ki.locale = :locale', { locale })
      .groupBy('ki.id')
      .addGroupBy('vm.id')
      .having('COUNT(c.id) > 0')
      .orderBy('COUNT(c.id)', 'DESC')
      .limit(limit)
      .getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      commentCount: Number((raw as RawTopFaultCount[])[index].commentCount),
    }));
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
}
