import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [CommentsModule, VehicleModelsModule, KnownIssuesModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
