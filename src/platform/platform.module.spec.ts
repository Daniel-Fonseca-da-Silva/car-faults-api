import { CommentsModule } from '../comments/comments.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { PlatformController } from './platform.controller';
import { PlatformModule } from './platform.module';
import { PlatformService } from './platform.service';

describe('PlatformModule', () => {
  it('imports the domain feature modules and registers the controller and service', () => {
    const imports = Reflect.getMetadata('imports', PlatformModule) as unknown[];
    const controllers = Reflect.getMetadata(
      'controllers',
      PlatformModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      PlatformModule,
    ) as unknown[];

    expect(imports).toEqual([
      CommentsModule,
      KnownIssuesModule,
      VehicleModelsModule,
    ]);
    expect(controllers).toEqual([PlatformController]);
    expect(providers).toEqual([PlatformService]);
  });
});
