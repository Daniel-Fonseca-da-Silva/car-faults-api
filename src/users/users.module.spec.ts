import { TypeOrmModule } from '@nestjs/typeorm';
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

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(providers).toEqual([UsersRepository, UsersService]);
    expect(moduleExports).toEqual([UsersService]);
  });
});
