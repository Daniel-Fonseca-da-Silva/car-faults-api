import { TypeOrmModule } from '@nestjs/typeorm';
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

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(providers).toEqual([KnownIssuesRepository, KnownIssuesService]);
    expect(moduleExports).toEqual([KnownIssuesService]);
  });
});
