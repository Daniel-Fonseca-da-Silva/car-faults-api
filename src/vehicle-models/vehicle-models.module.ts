import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { VehicleModelsRepository } from './vehicle-models.repository';
import { VehicleModelsService } from './vehicle-models.service';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleModel])],
  providers: [VehicleModelsRepository, VehicleModelsService],
  exports: [VehicleModelsService],
})
export class VehicleModelsModule {}
