import { ConfigModule } from '@nestjs/config';
import { TurnstileModule } from './turnstile.module';
import { TurnstileService } from './turnstile.service';

describe('TurnstileModule', () => {
  it('imports ConfigModule and provides/exports TurnstileService', () => {
    const imports = Reflect.getMetadata(
      'imports',
      TurnstileModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      TurnstileModule,
    ) as unknown[];
    const moduleExports = Reflect.getMetadata(
      'exports',
      TurnstileModule,
    ) as unknown[];

    expect(imports).toEqual([ConfigModule]);
    expect(providers).toEqual([TurnstileService]);
    expect(moduleExports).toEqual([TurnstileService]);
  });
});
