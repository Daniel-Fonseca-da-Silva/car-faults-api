import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KnownIssue } from '../../known-issues/entities/known-issue.entity';

@Entity('vehicle_models')
export class VehicleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ name: 'year_from', type: 'int' })
  yearFrom: number;

  @Column({ name: 'year_to', type: 'int', nullable: true })
  yearTo: number | null;

  @Column()
  engine: string;

  @Column({ type: 'int', nullable: true })
  doors: number | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'tech_specs', type: 'jsonb', nullable: true })
  techSpecs: Record<string, unknown> | null;

  @OneToMany(() => KnownIssue, (knownIssue) => knownIssue.vehicleModel)
  knownIssues: KnownIssue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
