import { ConfigService } from '@nestjs/config';
import { isProductionEnvironment } from '../logger/pino-http.options';
import { AiLookupProvider } from './ai-lookup.provider';
import { HttpAiLookupProvider } from './http-ai-lookup.provider';
import { StubAiLookupProvider } from './stub-ai-lookup.provider';

export function createAiLookupProvider(
  configService: ConfigService,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): AiLookupProvider {
  const provider = configService.get<string>('AI_PROVIDER', 'stub');

  if (isProductionEnvironment(nodeEnv) && provider !== 'http') {
    throw new Error(
      'AI_PROVIDER must be "http" in production; refusing to start with the stub AI lookup provider',
    );
  }

  if (provider !== 'http') {
    return new StubAiLookupProvider();
  }

  configService.getOrThrow<string>('AI_API_URL');
  return new HttpAiLookupProvider(configService);
}
