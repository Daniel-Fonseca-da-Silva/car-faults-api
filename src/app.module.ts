import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { createThrottlerOptions } from './common/throttler/throttler-options.factory';
import { DatabaseModule } from './database/database.module';
import { FixesModule } from './fixes/fixes.module';
import { HealthModule } from './health/health.module';
import { KnownIssuesModule } from './known-issues/known-issues.module';
import { LoggerModule } from './logger/logger.module';
import { LookupsModule } from './lookups/lookups.module';
import { UserVehiclesModule } from './user-vehicles/user-vehicles.module';
import { UsersModule } from './users/users.module';
import { VehicleModelsModule } from './vehicle-models/vehicle-models.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createThrottlerOptions,
    }),
    DatabaseModule,
    LoggerModule,
    HealthModule,
    UsersModule,
    AuthModule,
    VehicleModelsModule,
    KnownIssuesModule,
    FixesModule,
    LookupsModule,
    UserVehiclesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
