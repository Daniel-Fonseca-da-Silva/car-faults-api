import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fix } from '../../fixes/entities/fix.entity';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';
import { IssueSeverity } from '../enums/issue-severity.enum';

@Entity('known_issues')
export class KnownIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_model_id' })
  vehicleModelId: string;

  @ManyToOne(() => VehicleModel, (vehicleModel) => vehicleModel.knownIssues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_model_id' })
  vehicleModel: VehicleModel;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IssueSeverity })
  severity: IssueSeverity;

  @Column({ name: 'typical_km', type: 'int', nullable: true })
  typicalKm: number | null;

  @Column({ type: 'jsonb', nullable: true })
  sources: string[] | null;

  @Column({ name: 'ai_generated_at', type: 'timestamp', nullable: true })
  aiGeneratedAt: Date | null;

  @OneToMany(() => Fix, (fix) => fix.knownIssue)
  fixes: Fix[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
