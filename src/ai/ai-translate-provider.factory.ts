import { ConfigService } from '@nestjs/config';
import { AiTranslateProvider } from './ai-translate.provider';
import { HttpAiTranslateProvider } from './http-ai-translate.provider';
import { StubAiTranslateProvider } from './stub-ai-translate.provider';

export function createAiTranslateProvider(
  configService: ConfigService,
): AiTranslateProvider {
  const provider = configService.get<string>('AI_PROVIDER', 'stub');
  return provider === 'http'
    ? new HttpAiTranslateProvider(configService)
    : new StubAiTranslateProvider();
}
