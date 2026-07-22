import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fix } from './entities/fix.entity';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fix])],
  providers: [FixesRepository, FixesService],
  exports: [FixesService],
})
export class FixesModule {}
