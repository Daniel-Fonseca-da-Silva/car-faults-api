import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

const MEMORY_HEAP_LIMIT_BYTES = 200 * 1024 * 1024;

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check if the API and database are healthy' })
  @ApiOkResponse({
    description: 'Application and database are healthy',
  })
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', MEMORY_HEAP_LIMIT_BYTES),
      () => this.db.pingCheck('database'),
    ]);
  }
}
