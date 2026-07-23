import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { CommentsController } from './comments.controller';
import { CommentsModule } from './comments.module';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

describe('CommentsModule', () => {
  it('imports the domain feature modules and registers the controller, repository and service', () => {
    const imports = Reflect.getMetadata('imports', CommentsModule) as Array<{
      module?: unknown;
    }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      CommentsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      CommentsModule,
    ) as unknown[];

    expect(imports).toHaveLength(2);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(KnownIssuesModule);
    expect(controllers).toEqual([CommentsController]);
    expect(providers).toEqual([CommentsRepository, CommentsService]);
  });
});
