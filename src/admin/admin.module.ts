import { Module } from '@nestjs/common';
import { FixesModule } from '../fixes/fixes.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { AdminFixesController } from './admin-fixes.controller';
import { AdminKnownIssuesController } from './admin-known-issues.controller';
import { AdminVehicleModelsController } from './admin-vehicle-models.controller';

@Module({
  imports: [VehicleModelsModule, KnownIssuesModule, FixesModule],
  controllers: [
    AdminVehicleModelsController,
    AdminKnownIssuesController,
    AdminFixesController,
  ],
})
export class AdminModule {}
