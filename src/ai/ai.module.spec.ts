import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai.module';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { AI_LOOKUP_PROVIDER } from './ai-lookup.provider';
import { createAiTranslateProvider } from './ai-translate-provider.factory';
import { AI_TRANSLATE_PROVIDER } from './ai-translate.provider';

describe('AiModule', () => {
  it('registers the AI lookup and translate provider tokens using their factories', () => {
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
    expect(providers).toHaveLength(2);

    const lookupProvider = providers.find(
      (provider) => provider.provide === AI_LOOKUP_PROVIDER,
    );
    expect(lookupProvider?.inject).toHaveLength(1);
    expect(lookupProvider?.useFactory).toBe(createAiLookupProvider);

    const translateProvider = providers.find(
      (provider) => provider.provide === AI_TRANSLATE_PROVIDER,
    );
    expect(translateProvider?.inject).toHaveLength(1);
    expect(translateProvider?.useFactory).toBe(createAiTranslateProvider);

    expect(moduleExports).toEqual([AI_LOOKUP_PROVIDER, AI_TRANSLATE_PROVIDER]);
  });
});
