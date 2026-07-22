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
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';

@Entity('user_vehicles')
@Unique(['userId', 'brand', 'model', 'year', 'engine'])
export class UserVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'vehicle_model_id', type: 'uuid', nullable: true })
  vehicleModelId: string | null;

  @ManyToOne(() => VehicleModel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_model_id' })
  vehicleModel: VehicleModel | null;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column()
  engine: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'int', nullable: true })
  doors: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
