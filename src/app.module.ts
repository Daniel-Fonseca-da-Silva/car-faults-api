import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [LoggerModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
