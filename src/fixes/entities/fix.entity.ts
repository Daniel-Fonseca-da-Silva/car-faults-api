import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';
import { FixSource } from '../enums/fix-source.enum';

@Entity('fixes')
export class Fix {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'known_issue_id' })
  knownIssueId: string;

  @ManyToOne(() => KnownIssue, (knownIssue) => knownIssue.fixes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'known_issue_id' })
  knownIssue: KnownIssue;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column()
  summary: string;

  @Column({ type: 'text' })
  steps: string;

  @Column({
    name: 'estimated_cost_eur',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  estimatedCostEur: string | null;

  @Column({ type: 'enum', enum: FixSource })
  source: FixSource;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
