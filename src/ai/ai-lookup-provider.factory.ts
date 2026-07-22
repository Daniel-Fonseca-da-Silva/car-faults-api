import { ConfigService } from '@nestjs/config';
import { AiLookupProvider } from './ai-lookup.provider';
import { HttpAiLookupProvider } from './http-ai-lookup.provider';
import { StubAiLookupProvider } from './stub-ai-lookup.provider';

export function createAiLookupProvider(
  configService: ConfigService,
): AiLookupProvider {
  const provider = configService.get<string>('AI_PROVIDER', 'stub');
  return provider === 'http'
    ? new HttpAiLookupProvider(configService)
    : new StubAiLookupProvider();
}
