import { FixesModule } from '../fixes/fixes.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { AdminFixesController } from './admin-fixes.controller';
import { AdminKnownIssuesController } from './admin-known-issues.controller';
import { AdminVehicleModelsController } from './admin-vehicle-models.controller';
import { AdminModule } from './admin.module';

describe('AdminModule', () => {
  it('imports the domain modules and registers the admin controllers', () => {
    const imports = Reflect.getMetadata('imports', AdminModule) as unknown[];
    const controllers = Reflect.getMetadata(
      'controllers',
      AdminModule,
    ) as unknown[];

    expect(imports).toEqual([
      VehicleModelsModule,
      KnownIssuesModule,
      FixesModule,
    ]);
    expect(controllers).toEqual([
      AdminVehicleModelsController,
      AdminKnownIssuesController,
      AdminFixesController,
    ]);
  });
});
