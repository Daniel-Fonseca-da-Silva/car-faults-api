import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { UserVehiclesController } from './user-vehicles.controller';
import { UserVehiclesModule } from './user-vehicles.module';
import { UserVehiclesRepository } from './user-vehicles.repository';
import { UserVehiclesService } from './user-vehicles.service';

describe('UserVehiclesModule', () => {
  it('imports the domain feature modules and registers the controller, repository and service', () => {
    const imports = Reflect.getMetadata(
      'imports',
      UserVehiclesModule,
    ) as Array<{ module?: unknown }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      UserVehiclesModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      UserVehiclesModule,
    ) as unknown[];

    expect(imports).toHaveLength(3);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(VehicleModelsModule);
    expect(imports[2]).toBe(KnownIssuesModule);
    expect(controllers).toEqual([UserVehiclesController]);
    expect(providers).toEqual([UserVehiclesRepository, UserVehiclesService]);
  });
});
