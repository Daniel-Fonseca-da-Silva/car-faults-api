import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { KnownIssuesModule } from './known-issues.module';
import { KnownIssuesRepository } from './known-issues.repository';
import { KnownIssuesService } from './known-issues.service';

describe('KnownIssuesModule', () => {
  it('registers the KnownIssue feature module, repository and service', () => {
    const imports = Reflect.getMetadata('imports', KnownIssuesModule) as Array<{
      module?: unknown;
    }>;
    const providers = Reflect.getMetadata(
      'providers',
      KnownIssuesModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      KnownIssuesModule,
    ) as unknown[];

    expect(imports).toHaveLength(2);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(VehicleModelsModule);
    expect(providers).toEqual([KnownIssuesRepository, KnownIssuesService]);
    expect(moduleExports).toEqual([KnownIssuesService]);
  });
});
