import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixVote } from './entities/fix-vote.entity';
import { FixVoteValue } from './enums/fix-vote-value.enum';

@Injectable()
export class FixVotesRepository {
  constructor(
    @InjectRepository(FixVote)
    private readonly repository: Repository<FixVote>,
  ) {}

  findByFixAndUser(fixId: string, userId: string): Promise<FixVote | null> {
    return this.repository.findOne({ where: { fixId, userId } });
  }

  countByUserIdAndValue(userId: string, value: FixVoteValue): Promise<number> {
    return this.repository.count({ where: { userId, value } });
  }

  create(data: Partial<FixVote>): FixVote {
    return this.repository.create(data);
  }

  save(vote: FixVote): Promise<FixVote> {
    return this.repository.save(vote);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
