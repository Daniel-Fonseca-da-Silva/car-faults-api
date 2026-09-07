import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { buildKeysetWhere } from '../common/pagination/keyset.util';
import { UserVehicle } from './entities/user-vehicle.entity';

export interface UserVehicleUniqueKey {
  userId: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
}

export interface UserVehicleCursor {
  [key: string]: string;
  createdAt: string;
  id: string;
}

@Injectable()
export class UserVehiclesRepository {
  constructor(
    @InjectRepository(UserVehicle)
    private readonly repository: Repository<UserVehicle>,
  ) {}

  findPageByUserId(
    userId: string,
    limit: number,
    cursor?: UserVehicleCursor,
  ): Promise<UserVehicle[]> {
    const qb = this.repository
      .createQueryBuilder('user_vehicle')
      .leftJoinAndSelect('user_vehicle.vehicleModel', 'vehicleModel')
      .where('user_vehicle.userId = :userId', { userId })
      .orderBy('user_vehicle.createdAt', 'DESC')
      .addOrderBy('user_vehicle.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const { sql, params } = buildKeysetWhere(
        [
          {
            expr: 'user_vehicle.createdAt',
            direction: 'DESC',
            param: 'createdAt',
          },
          { expr: 'user_vehicle.id', direction: 'DESC', param: 'id' },
        ],
        cursor,
      );
      qb.andWhere(sql, params);
    }

    return qb.getMany();
  }

  countByUserId(userId: string): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  async existsByVehicleModelAndYear(
    userId: string,
    vehicleModelId: string,
    year: number,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, vehicleModelId, year },
    });
    return count > 0;
  }

  findById(id: string): Promise<UserVehicle | null> {
    return this.repository.findOne({
      where: { id },
      relations: { vehicleModel: true },
    });
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

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
