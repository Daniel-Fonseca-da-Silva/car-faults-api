import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogModule } from './activity-log.module';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogService } from './activity-log.service';

describe('ActivityLogModule', () => {
  it('registers the ActivityLog feature module, repository, service and controller', () => {
    const imports = Reflect.getMetadata('imports', ActivityLogModule) as Array<{
      module?: unknown;
    }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      ActivityLogModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      ActivityLogModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      ActivityLogModule,
    ) as unknown[];

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(controllers).toEqual([ActivityLogController]);
    expect(providers).toEqual([ActivityLogRepository, ActivityLogService]);
    expect(moduleExports).toEqual([ActivityLogService]);
  });
});
