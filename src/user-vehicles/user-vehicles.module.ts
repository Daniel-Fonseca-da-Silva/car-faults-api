import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { UserVehicle } from './entities/user-vehicle.entity';
import { UserVehiclesController } from './user-vehicles.controller';
import { UserVehiclesRepository } from './user-vehicles.repository';
import { UserVehiclesService } from './user-vehicles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserVehicle]),
    VehicleModelsModule,
    KnownIssuesModule,
  ],
  controllers: [UserVehiclesController],
  providers: [UserVehiclesRepository, UserVehiclesService],
})
export class UserVehiclesModule {}
