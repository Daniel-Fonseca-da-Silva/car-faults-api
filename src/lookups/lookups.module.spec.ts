import { AiModule } from '../ai/ai.module';
import { FixesModule } from '../fixes/fixes.module';
import { KnownIssuesModule } from '../known-issues/known-issues.module';
import { VehicleModelsModule } from '../vehicle-models/vehicle-models.module';
import { LookupsController } from './lookups.controller';
import { LookupsModule } from './lookups.module';
import { LookupsService } from './lookups.service';

describe('LookupsModule', () => {
  it('imports the domain feature modules and registers the controller and service', () => {
    const imports = Reflect.getMetadata('imports', LookupsModule) as unknown[];
    const controllers = Reflect.getMetadata(
      'controllers',
      LookupsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      LookupsModule,
    ) as unknown[];

    expect(imports).toEqual([
      VehicleModelsModule,
      KnownIssuesModule,
      FixesModule,
      AiModule,
    ]);
    expect(controllers).toEqual([LookupsController]);
    expect(providers).toEqual([LookupsService]);
  });
});
