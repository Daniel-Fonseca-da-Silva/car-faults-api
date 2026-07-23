import { RedisHealthIndicator } from './redis-health.indicator';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisClient: { ping: jest.Mock };
  let healthIndicatorService: { check: jest.Mock };
  let up: jest.Mock;
  let down: jest.Mock;

  beforeEach(() => {
    redisClient = { ping: jest.fn() };
    up = jest.fn().mockReturnValue({ redis: { status: 'up' } });
    down = jest.fn().mockReturnValue({ redis: { status: 'down' } });
    healthIndicatorService = {
      check: jest.fn().mockReturnValue({ up, down }),
    };

    indicator = new RedisHealthIndicator(
      redisClient as never,
      healthIndicatorService as never,
    );
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('returns up when ping succeeds', async () => {
    redisClient.ping.mockResolvedValue('PONG');

    const result = await indicator.isHealthy('redis');

    expect(healthIndicatorService.check).toHaveBeenCalledWith('redis');
    expect(redisClient.ping).toHaveBeenCalled();
    expect(up).toHaveBeenCalled();
    expect(down).not.toHaveBeenCalled();
    expect(result).toEqual({ redis: { status: 'up' } });
  });

  it('returns down when ping fails', async () => {
    redisClient.ping.mockRejectedValue(new Error('connection refused'));

    const result = await indicator.isHealthy('redis');

    expect(down).toHaveBeenCalledWith('connection refused');
    expect(up).not.toHaveBeenCalled();
    expect(result).toEqual({ redis: { status: 'down' } });
  });

  it('returns down with fallback message when the error is not an Error instance', async () => {
    redisClient.ping.mockRejectedValue('boom');

    await indicator.isHealthy('redis');

    expect(down).toHaveBeenCalledWith('ping failed');
  });
});
