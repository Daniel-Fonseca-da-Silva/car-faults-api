import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { KnownIssue } from './entities/known-issue.entity';
import { KnownIssuesRepository } from './known-issues.repository';
import { KnownIssuesService } from './known-issues.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnownIssue]), VehicleModelsModule],
  providers: [KnownIssuesRepository, KnownIssuesService],
  exports: [KnownIssuesService],
})
export class KnownIssuesModule {}
