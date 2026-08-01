import { R2StorageService } from './r2-storage.service';
import { StorageController } from './storage.controller';
import { StorageModule } from './storage.module';

describe('StorageModule', () => {
  it('registers the controller and service, exporting the service', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      StorageModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      StorageModule,
    ) as unknown[];
    const exports = Reflect.getMetadata('exports', StorageModule) as unknown[];

    expect(controllers).toEqual([StorageController]);
    expect(providers).toEqual([R2StorageService]);
    expect(exports).toEqual([R2StorageService]);
  });
});
