import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Fix } from './entities/fix.entity';
import { FixVoteValue } from './enums/fix-vote-value.enum';

export type FixWithCounts = Fix & {
  likes: number;
  dislikes: number;
  myVote: FixVoteValue | null;
};

interface RawFixCounts {
  likes: string | number;
  dislikes: string | number;
  myVote: FixVoteValue | null;
}

@Injectable()
export class FixesRepository {
  constructor(
    @InjectRepository(Fix)
    private readonly repository: Repository<Fix>,
  ) {}

  saveMany(fixes: Partial<Fix>[], manager: EntityManager): Promise<Fix[]> {
    return manager.getRepository(Fix).save(fixes);
  }

  findById(id: string): Promise<Fix | null> {
    return this.repository.findOne({ where: { id } });
  }

  create(data: Partial<Fix>): Fix {
    return this.repository.create(data);
  }

  save(fix: Fix): Promise<Fix> {
    return this.repository.save(fix);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByKnownIssueIdWithCounts(
    knownIssueId: string,
    userId?: string,
  ): Promise<FixWithCounts[]> {
    const { entities, raw } = await this.countsQuery(userId)
      .where('fix.known_issue_id = :knownIssueId', { knownIssueId })
      .orderBy('likes', 'DESC')
      .addOrderBy('dislikes', 'ASC')
      .addOrderBy('fix.created_at', 'ASC')
      .getRawAndEntities();

    return this.mapCounts(entities, raw as RawFixCounts[]);
  }

  async findByIdWithCounts(
    id: string,
    userId?: string,
  ): Promise<FixWithCounts | null> {
    const { entities, raw } = await this.countsQuery(userId)
      .where('fix.id = :id', { id })
      .getRawAndEntities();

    if (entities.length === 0) {
      return null;
    }
    return this.mapCounts(entities, raw as RawFixCounts[])[0];
  }

  private countsQuery(userId?: string) {
    const qb = this.repository
      .createQueryBuilder('fix')
      .leftJoin('fix_votes', 'vote', 'vote.fix_id = fix.id')
      .addSelect("COUNT(*) FILTER (WHERE vote.value = 'like')", 'likes')
      .addSelect("COUNT(*) FILTER (WHERE vote.value = 'dislike')", 'dislikes')
      .groupBy('fix.id');

    if (userId) {
      qb.leftJoin(
        'fix_votes',
        'my_vote',
        'my_vote.fix_id = fix.id AND my_vote.user_id = :userId',
        { userId },
      )
        .addSelect('my_vote.value', 'myVote')
        .addGroupBy('my_vote.value');
    }

    return qb;
  }

  private mapCounts(entities: Fix[], raw: RawFixCounts[]): FixWithCounts[] {
    return entities.map((entity, index) => ({
      ...entity,
      likes: Number(raw[index].likes),
      dislikes: Number(raw[index].dislikes),
      myVote: raw[index].myVote ?? null,
    }));
  }
}
