import { Module } from '@nestjs/common';
import { FixesModule } from '../fixes/fixes.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { ReportsModule } from '../reports/reports.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { AdminFixesController } from './admin-fixes.controller';
import { AdminKnownIssuesController } from './admin-known-issues.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminVehicleModelsController } from './admin-vehicle-models.controller';

@Module({
  imports: [VehicleModelsModule, KnownIssuesModule, FixesModule, ReportsModule],
  controllers: [
    AdminVehicleModelsController,
    AdminKnownIssuesController,
    AdminFixesController,
    AdminReportsController,
  ],
})
export class AdminModule {}
