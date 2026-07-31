import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AiModule } from '../ai/ai.module';
import { FixesModule } from '../fixes/fixes.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { TurnstileModule } from '../turnstile/turnstile.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

@Module({
  imports: [
    VehicleModelsModule,
    KnownIssuesModule,
    FixesModule,
    AiModule,
    ActivityLogModule,
    TurnstileModule,
  ],
  controllers: [LookupsController],
  providers: [LookupsService],
})
export class LookupsModule {}
