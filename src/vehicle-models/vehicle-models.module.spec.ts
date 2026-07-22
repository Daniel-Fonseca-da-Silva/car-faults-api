import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleModelsModule } from './vehicle-models.module';
import { VehicleModelsRepository } from './vehicle-models.repository';
import { VehicleModelsService } from './vehicle-models.service';

describe('VehicleModelsModule', () => {
  it('registers the VehicleModel feature module, repository and service', () => {
    const imports = Reflect.getMetadata(
      'imports',
      VehicleModelsModule,
    ) as Array<{ module?: unknown }>;
    const providers = Reflect.getMetadata(
      'providers',
      VehicleModelsModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      VehicleModelsModule,
    ) as unknown[];

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(providers).toEqual([VehicleModelsRepository, VehicleModelsService]);
    expect(moduleExports).toEqual([VehicleModelsService]);
  });
});
