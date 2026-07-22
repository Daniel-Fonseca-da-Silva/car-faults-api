import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

const MEMORY_HEAP_LIMIT_BYTES = 209715200;

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let memoryHealthIndicator: { checkHeap: jest.Mock };
  let typeOrmHealthIndicator: { pingCheck: jest.Mock };

  const healthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: { memory_heap: { status: 'up' }, database: { status: 'up' } },
    error: {},
    details: { memory_heap: { status: 'up' }, database: { status: 'up' } },
  };

  beforeEach(async () => {
    memoryHealthIndicator = { checkHeap: jest.fn() };
    typeOrmHealthIndicator = { pingCheck: jest.fn() };

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
        {
          provide: TypeOrmHealthIndicator,
          useValue: typeOrmHealthIndicator,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue(String(MEMORY_HEAP_LIMIT_BYTES)),
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
      MEMORY_HEAP_LIMIT_BYTES,
    );
  });

  it('should run the database ping indicator passed to HealthCheckService.check', async () => {
    const checkSpy = jest
      .spyOn(healthCheckService, 'check')
      .mockImplementation((indicators) => {
        indicators.forEach((indicator) => void indicator());
        return Promise.resolve(healthCheckResult);
      });

    await controller.check();

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
  });
});
