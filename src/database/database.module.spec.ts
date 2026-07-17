import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('registers TypeOrmModule and re-exports it for feature modules', () => {
    const imports = Reflect.getMetadata('imports', DatabaseModule) as Array<{
      module?: unknown;
    }>;
    const exports = Reflect.getMetadata('exports', DatabaseModule) as
      unknown[] | undefined;

    expect(imports).toHaveLength(1);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(exports).toContain(TypeOrmModule);
  });
});
