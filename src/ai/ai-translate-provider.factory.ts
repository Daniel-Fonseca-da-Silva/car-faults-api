import { ConfigService } from '@nestjs/config';
import { isProductionEnvironment } from '../logger/pino-http.options';
import { AiTranslateProvider } from './ai-translate.provider';
import { HttpAiTranslateProvider } from './http-ai-translate.provider';
import { StubAiTranslateProvider } from './stub-ai-translate.provider';

export function createAiTranslateProvider(
  configService: ConfigService,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): AiTranslateProvider {
  const provider = configService.get<string>('AI_PROVIDER', 'stub');

  if (isProductionEnvironment(nodeEnv) && provider !== 'http') {
    throw new Error(
      'AI_PROVIDER must be "http" in production; refusing to start with the stub AI translate provider',
    );
  }

  if (provider !== 'http') {
    return new StubAiTranslateProvider();
  }

  configService.getOrThrow<string>('AI_TRANSLATE_URL');
  return new HttpAiTranslateProvider(configService);
}
