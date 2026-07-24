import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { FixVote } from './entities/fix-vote.entity';
import { Fix } from './entities/fix.entity';
import { FixVotesRepository } from './fix-votes.repository';
import { FixesController } from './fixes.controller';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fix, FixVote]),
    KnownIssuesModule,
    VehicleModelsModule,
  ],
  controllers: [FixesController],
  providers: [FixesRepository, FixVotesRepository, FixesService],
  exports: [FixesService],
})
export class FixesModule {}
