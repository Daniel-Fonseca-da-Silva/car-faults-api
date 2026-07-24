import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FixVoteValue } from '../enums/fix-vote-value.enum';
import { Fix } from './fix.entity';

@Entity('fix_votes')
@Unique(['fixId', 'userId'])
export class FixVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fix_id' })
  fixId: string;

  @ManyToOne(() => Fix, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fix_id' })
  fix: Fix;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: FixVoteValue })
  value: FixVoteValue;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
