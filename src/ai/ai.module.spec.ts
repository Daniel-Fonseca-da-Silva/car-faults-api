import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai.module';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { AI_LOOKUP_PROVIDER } from './ai-lookup.provider';

describe('AiModule', () => {
  it('registers the AI lookup provider token using the factory', () => {
    const imports = Reflect.getMetadata('imports', AiModule) as Array<{
      module?: unknown;
    }>;
    const providers = Reflect.getMetadata('providers', AiModule) as Array<{
      provide: unknown;
      inject: unknown[];
      useFactory: unknown;
    }>;
    const moduleExports = Reflect.getMetadata('exports', AiModule) as unknown[];

    expect(imports).toEqual([ConfigModule]);
    expect(providers).toHaveLength(1);
    expect(providers[0].provide).toBe(AI_LOOKUP_PROVIDER);
    expect(providers[0].inject).toHaveLength(1);
    expect(providers[0].useFactory).toBe(createAiLookupProvider);
    expect(moduleExports).toEqual([AI_LOOKUP_PROVIDER]);
  });
});
