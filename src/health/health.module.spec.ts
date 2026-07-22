import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthModule } from './health.module';
import { HealthController } from './health.controller';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module.get(HealthModule)).toBeDefined();
  });

  it('should provide HealthController', () => {
    expect(module.get(HealthController)).toBeDefined();
  });
});
