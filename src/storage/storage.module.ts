import { Module } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class StorageModule {}
