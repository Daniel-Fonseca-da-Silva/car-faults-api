import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModule } from '../comments/comments.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ReportsController } from './reports.controller';
import { ReportsModule } from './reports.module';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsModule', () => {
  it('imports the domain feature modules and registers the controller, repository and service', () => {
    const imports = Reflect.getMetadata('imports', ReportsModule) as Array<{
      module?: unknown;
    }>;
    const controllers = Reflect.getMetadata(
      'controllers',
      ReportsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      ReportsModule,
    ) as unknown[];
    const exportsMetadata = Reflect.getMetadata(
      'exports',
      ReportsModule,
    ) as unknown[];

    expect(imports).toHaveLength(3);
    expect(imports[0].module).toBe(TypeOrmModule);
    expect(imports[1]).toBe(CommentsModule);
    expect(imports[2]).toBe(ReviewsModule);
    expect(controllers).toEqual([ReportsController]);
    expect(providers).toEqual([ReportsRepository, ReportsService]);
    expect(exportsMetadata).toEqual([ReportsService]);
  });
});
