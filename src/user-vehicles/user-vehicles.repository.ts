import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserVehicle } from './entities/user-vehicle.entity';

export interface UserVehicleUniqueKey {
  userId: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
}

@Injectable()
export class UserVehiclesRepository {
  constructor(
    @InjectRepository(UserVehicle)
    private readonly repository: Repository<UserVehicle>,
  ) {}

  findAllByUserId(userId: string): Promise<UserVehicle[]> {
    return this.repository.find({ where: { userId } });
  }

  findById(id: string): Promise<UserVehicle | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByUniqueKey(
    key: UserVehicleUniqueKey,
    excludeId?: string,
  ): Promise<UserVehicle | null> {
    return this.repository.findOne({
      where: {
        userId: key.userId,
        brand: key.brand,
        model: key.model,
        year: key.year,
        engine: key.engine,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
  }

  create(data: Partial<UserVehicle>): UserVehicle {
    return this.repository.create(data);
  }

  save(userVehicle: UserVehicle): Promise<UserVehicle> {
    return this.repository.save(userVehicle);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
