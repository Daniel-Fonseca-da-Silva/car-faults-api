import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({})
class DatabaseModuleStub {}

@Module({})
class UsersModuleStub {}

@Module({})
class AuthModuleStub {}

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(DatabaseModuleStub)
      .overrideModule(UsersModule)
      .useModule(UsersModuleStub)
      .overrideModule(AuthModule)
      .useModule(AuthModuleStub)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module.get(AppModule)).toBeDefined();
  });
});
