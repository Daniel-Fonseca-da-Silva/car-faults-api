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
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Unique(['userId', 'knownIssueId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'known_issue_id' })
  knownIssueId: string;

  @ManyToOne(() => KnownIssue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'known_issue_id' })
  knownIssue: KnownIssue;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
