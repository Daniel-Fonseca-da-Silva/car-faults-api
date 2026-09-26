import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { DatabaseModule } from './database/database.module';
import { FixesModule } from './fixes/fixes.module';
import { KnownIssuesModule } from './known-issues/known-issues.module';
import { LookupsModule } from './lookups/lookups.module';
import { PlatformModule } from './platform/platform.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StorageModule } from './storage/storage.module';
import { UserVehiclesModule } from './user-vehicles/user-vehicles.module';
import { UsersModule } from './users/users.module';
import { VehicleModelsModule } from './vehicle-models/vehicle-models.module';

@Module({})
class DatabaseModuleStub {}

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useValue: { ping: jest.fn().mockResolvedValue('PONG') },
    },
  ],
  exports: [REDIS_CLIENT],
})
class RedisModuleStub {}

@Module({})
class UsersModuleStub {}

@Module({})
class AuthModuleStub {}

@Module({})
class ActivityLogModuleStub {}

@Module({})
class VehicleModelsModuleStub {}

@Module({})
class KnownIssuesModuleStub {}

@Module({})
class FixesModuleStub {}

@Module({})
class LookupsModuleStub {}

@Module({})
class UserVehiclesModuleStub {}

@Module({})
class ReviewsModuleStub {}

@Module({})
class CommentsModuleStub {}

@Module({})
class ReportsModuleStub {}

@Module({})
class StorageModuleStub {}

@Module({})
class AdminModuleStub {}

@Module({})
class PlatformModuleStub {}

// ConfigModule.forRoot validates the environment as soon as app.module is
// loaded, so the required variables must exist before it is imported (CI has
// no .env file).
const TEST_ENV = {
  JWT_SECRET: 'test-jwt-secret-with-at-least-32-characters',
  THROTTLE_TTL_MS: '60000',
  THROTTLE_LIMIT: '100',
  THROTTLE_AUTH_TTL_MS: '60000',
  THROTTLE_AUTH_LIMIT: '10',
  THROTTLE_LOOKUPS_TTL_MS: '60000',
  THROTTLE_LOOKUPS_LIMIT: '100',
  THROTTLE_AI_MOBILE_TTL_MS: '60000',
  THROTTLE_AI_MOBILE_LIMIT: '10',
};

describe('AppModule', () => {
  let AppModule: typeof import('./app.module').AppModule;
  let module: TestingModule;

  beforeAll(async () => {
    Object.assign(process.env, TEST_ENV);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ({ AppModule } = await import('./app.module'));
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(DatabaseModuleStub)
      .overrideModule(RedisModule)
      .useModule(RedisModuleStub)
      .overrideModule(UsersModule)
      .useModule(UsersModuleStub)
      .overrideModule(AuthModule)
      .useModule(AuthModuleStub)
      .overrideModule(ActivityLogModule)
      .useModule(ActivityLogModuleStub)
      .overrideModule(VehicleModelsModule)
      .useModule(VehicleModelsModuleStub)
      .overrideModule(KnownIssuesModule)
      .useModule(KnownIssuesModuleStub)
      .overrideModule(FixesModule)
      .useModule(FixesModuleStub)
      .overrideModule(LookupsModule)
      .useModule(LookupsModuleStub)
      .overrideModule(UserVehiclesModule)
      .useModule(UserVehiclesModuleStub)
      .overrideModule(ReviewsModule)
      .useModule(ReviewsModuleStub)
      .overrideModule(CommentsModule)
      .useModule(CommentsModuleStub)
      .overrideModule(ReportsModule)
      .useModule(ReportsModuleStub)
      .overrideModule(StorageModule)
      .useModule(StorageModuleStub)
      .overrideModule(AdminModule)
      .useModule(AdminModuleStub)
      .overrideModule(PlatformModule)
      .useModule(PlatformModuleStub)
      .compile();
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(module.get(AppModule)).toBeDefined();
  });
});
