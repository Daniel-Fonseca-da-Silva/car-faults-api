import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { RedisHealthIndicator } from '../redis/redis-health.indicator';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check if the API and database are healthy' })
  @ApiOkResponse({
    description: 'Application and database are healthy',
  })
  check() {
    const memoryHeapLimitBytes = Number(
      this.config.getOrThrow<string>('HEALTH_MEMORY_HEAP_LIMIT_BYTES'),
    );

    return this.health.check([
      () => this.memory.checkHeap('memory_heap', memoryHeapLimitBytes),
      () => this.db.pingCheck('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
