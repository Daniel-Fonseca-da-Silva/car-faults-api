import { Test, TestingModule } from '@nestjs/testing';
import { Logger, PinoLogger } from 'nestjs-pino';
import { LoggerModule } from './logger.module';

describe('LoggerModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LoggerModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('provides NestJS Logger from nestjs-pino', () => {
    const logger = moduleRef.get(Logger);

    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('provides PinoLogger', async () => {
    const pinoLogger = await moduleRef.resolve(PinoLogger);

    expect(pinoLogger).toBeDefined();
    expect(pinoLogger).toBeInstanceOf(PinoLogger);
  });
});
