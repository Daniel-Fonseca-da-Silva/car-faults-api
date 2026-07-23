import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { DatabaseModule } from './database/database.module';
import { FixesModule } from './fixes/fixes.module';
import { KnownIssuesModule } from './known-issues/known-issues.module';
import { LookupsModule } from './lookups/lookups.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { RedisModule } from './redis/redis.module';
import { ReviewsModule } from './reviews/reviews.module';
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

describe('AppModule', () => {
  let module: TestingModule;

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
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module.get(AppModule)).toBeDefined();
  });
});
