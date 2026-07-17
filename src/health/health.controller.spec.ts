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
  let memoryHealthIndicator: { checkHeap: jest.Mock };

  const healthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: { memory_heap: { status: 'up' } },
    error: {},
    details: { memory_heap: { status: 'up' } },
  };

  beforeEach(async () => {
    memoryHealthIndicator = { checkHeap: jest.fn() };

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
          useValue: memoryHealthIndicator,
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

  it('should run the memory heap indicator passed to HealthCheckService.check', async () => {
    const checkSpy = jest
      .spyOn(healthCheckService, 'check')
      .mockImplementation((indicators) => {
        indicators.forEach((indicator) => void indicator());
        return Promise.resolve(healthCheckResult);
      });

    await controller.check();

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
      'memory_heap',
      200 * 1024 * 1024,
    );
  });
});
