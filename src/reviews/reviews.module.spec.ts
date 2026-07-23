import { TypeOrmModule } from '@nestjs/typeorm';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsModule } from './reviews.module';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

describe('ReviewsModule', () => {
  it('imports the domain feature modules and registers the controller, repository and service', () => {
    const imports = Reflect.getMetadata('imports', ReviewsModule) as Array<{
      module?: unknown;
    }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      ReviewsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      ReviewsModule,
    ) as unknown[];

    expect(imports).toHaveLength(2);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(KnownIssuesModule);
    expect(controllers).toEqual([ReviewsController]);
    expect(providers).toEqual([ReviewsRepository, ReviewsService]);
  });
});
