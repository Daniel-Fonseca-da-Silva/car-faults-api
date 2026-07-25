import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { AI_LOOKUP_PROVIDER } from './ai-lookup.provider';
import { createAiTranslateProvider } from './ai-translate-provider.factory';
import { AI_TRANSLATE_PROVIDER } from './ai-translate.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_LOOKUP_PROVIDER,
      inject: [ConfigService],
      useFactory: createAiLookupProvider,
    },
    {
      provide: AI_TRANSLATE_PROVIDER,
      inject: [ConfigService],
      useFactory: createAiTranslateProvider,
    },
  ],
  exports: [AI_LOOKUP_PROVIDER, AI_TRANSLATE_PROVIDER],
})
export class AiModule {}
