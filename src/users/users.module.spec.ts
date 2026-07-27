import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { FixesModule } from '../fixes/fixes.module';
import { UserVehiclesModule } from '../user-vehicles/user-vehicles.module';
import { UserStatsService } from './user-stats.service';
import { UsersModule } from './users.module';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  it('registers the User feature module, repository and service', () => {
    const imports = Reflect.getMetadata('imports', UsersModule) as Array<{
      module?: unknown;
    }>;
    const providers = Reflect.getMetadata(
      'providers',
      UsersModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      UsersModule,
    ) as unknown[];

    expect(imports).toHaveLength(4);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(ActivityLogModule);
    expect(imports[2]).toBe(FixesModule);
    expect(imports[3]).toBe(UserVehiclesModule);
    expect(providers).toEqual([
      UsersRepository,
      UsersService,
      UserStatsService,
    ]);
    expect(moduleExports).toEqual([UsersService]);
  });
});
