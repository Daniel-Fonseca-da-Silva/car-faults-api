import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { FixVotesRepository } from './fix-votes.repository';
import { FixesController } from './fixes.controller';
import { FixesModule } from './fixes.module';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

describe('FixesModule', () => {
  it('imports the domain feature modules and registers the controller, repositories and service', () => {
    const imports = Reflect.getMetadata('imports', FixesModule) as Array<{
      module?: unknown;
    }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      FixesModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      FixesModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      FixesModule,
    ) as unknown[];

    expect(imports).toHaveLength(3);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(KnownIssuesModule);
    expect(imports[2]).toBe(VehicleModelsModule);
    expect(controllers).toEqual([FixesController]);
    expect(providers).toEqual([
      FixesRepository,
      FixVotesRepository,
      FixesService,
    ]);
    expect(moduleExports).toEqual([FixesService]);
  });
});
