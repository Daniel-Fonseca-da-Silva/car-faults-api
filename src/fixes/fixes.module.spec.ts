import { TypeOrmModule } from '@nestjs/typeorm';
import { FixesModule } from './fixes.module';
import { FixesRepository } from './fixes.repository';
import { FixesService } from './fixes.service';

describe('FixesModule', () => {
  it('registers the Fix feature module, repository and service', () => {
    const imports = Reflect.getMetadata('imports', FixesModule) as Array<{
      module?: unknown;
    }>;
    const providers = Reflect.getMetadata(
      'providers',
      FixesModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      FixesModule,
    ) as unknown[];

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(providers).toEqual([FixesRepository, FixesService]);
    expect(moduleExports).toEqual([FixesService]);
  });
});
