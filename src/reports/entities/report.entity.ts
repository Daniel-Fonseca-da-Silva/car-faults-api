import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReportContentType } from '../enums/report-content-type.enum';
import { ReportReason } from '../enums/report-reason.enum';
import { ReportStatus } from '../enums/report-status.enum';

/**
 * `contentId` intentionally has no DB foreign key: it can point at either a
 * `comments` or a `reviews` row depending on `contentType`, and existence is
 * validated at write time by `ReportsService` instead (same pattern
 * `CommentsService`/`ReviewsService` use for `knownIssueId`).
 */
@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_user_id' })
  reporterUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_user_id' })
  reporter: User;

  @Column({ name: 'content_type', type: 'enum', enum: ReportContentType })
  contentType: ReportContentType;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
