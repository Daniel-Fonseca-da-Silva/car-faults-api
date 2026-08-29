import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { Fix } from './entities/fix.entity';
import { FixVoteValue } from './enums/fix-vote-value.enum';

export type FixWithCounts = Fix & {
  likes: number;
  dislikes: number;
  myVote: FixVoteValue | null;
};

export interface FixCursor {
  [key: string]: string | number;
  likes: number;
  dislikes: number;
  createdAt: string;
  id: string;
}

const LIKES_EXPR = "COUNT(*) FILTER (WHERE vote.value = 'like')";
const DISLIKES_EXPR = "COUNT(*) FILTER (WHERE vote.value = 'dislike')";

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

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
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

  async findByKnownIssueIdWithCountsPage(
    knownIssueId: string,
    limit: number,
    cursor?: FixCursor,
    userId?: string,
  ): Promise<FixWithCounts[]> {
    const qb = this.countsQuery(userId)
      .where('fix.known_issue_id = :knownIssueId', { knownIssueId })
      .orderBy('likes', 'DESC')
      .addOrderBy('dislikes', 'ASC')
      .addOrderBy('fix.created_at', 'ASC')
      .addOrderBy('fix.id', 'ASC')
      .limit(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          { expr: LIKES_EXPR, direction: 'DESC', param: 'likes' },
          { expr: DISLIKES_EXPR, direction: 'ASC', param: 'dislikes' },
          { expr: 'fix.created_at', direction: 'ASC', param: 'createdAt' },
          { expr: 'fix.id', direction: 'ASC', param: 'id' },
        ],
        cursor,
      );
      qb.andHaving(sql, params);
    }

    const { entities, raw } = await qb.getRawAndEntities();
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
      ).addSelect('MAX(my_vote.value)', 'myVote');
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
