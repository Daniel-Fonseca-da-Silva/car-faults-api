import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createAiLookupProvider } from './ai-lookup-provider.factory';
import { AI_LOOKUP_PROVIDER } from './ai-lookup.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_LOOKUP_PROVIDER,
      inject: [ConfigService],
      useFactory: createAiLookupProvider,
    },
  ],
  exports: [AI_LOOKUP_PROVIDER],
})
export class AiModule {}
