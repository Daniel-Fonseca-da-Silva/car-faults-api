import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const healthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: { memory_heap: { status: 'up' } },
    error: {},
    details: { memory_heap: { status: 'up' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockResolvedValue(healthCheckResult),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call HealthCheckService.check and return ok status', async () => {
    const checkSpy = jest.spyOn(healthCheckService, 'check');
    const result = await controller.check();

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
  });
});
