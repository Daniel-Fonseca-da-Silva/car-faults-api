import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

const MEMORY_HEAP_LIMIT_BYTES = 200 * 1024 * 1024;

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check if the API is healthy' })
  @ApiOkResponse({
    description: 'Application is healthy',
  })
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', MEMORY_HEAP_LIMIT_BYTES),
    ]);
  }
}
